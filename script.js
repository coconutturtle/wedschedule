async function loadEvents() {
    try {
        const response = await fetch('events.json');
        if (!response.ok) throw new Error("Failed to load events.json");

        const events = await response.json();
        const tocOverlayContent = document.querySelector('.toc-content');
        const eventsContainer = document.getElementById('events-container');
        const groupedEvents = events.reduce((acc, event) => {
            acc[event.date] = acc[event.date] || [];
            acc[event.date].push(event);
            return acc;
        }, {});

        const tocFragment = document.createDocumentFragment();
        const eventFragment = document.createDocumentFragment();

        for (const [date, dateEvents] of Object.entries(groupedEvents)) {
            createDateHeading(tocFragment, date);
            const eventList = document.createElement('ul');

            // Use Promise.all to parallelize creation of TOC entries and event sections
            dateEvents.forEach(event => {
                createTOCEntry(event, eventList);
                createEventSection(event, eventFragment); // removed await
            });

            tocFragment.appendChild(eventList);
        }

        tocOverlayContent.appendChild(tocFragment);
        eventsContainer.appendChild(eventFragment);

        setupLazyLoading();  // Initialize lazy loading for images
    } catch (error) {
        console.error("Error loading events:", error);
    }
}

// Function to create event sections with conditional image loading
function createEventSection(event, container) {
    const eventDiv = document.createElement('div');
    eventDiv.classList.add('event');
    eventDiv.id = event.id;

    const sentences = event.content.match(/[^.!?]+[.!?]*/g) || [];
    const previewContent = sentences[0];
    const remainingContent = sentences.slice(1).join(' ');

    // Assign image HTML only if image URL is present
    let imageHtml = '';
    if (event.image) {
        imageHtml = `<img data-src="${event.image}" alt="${event.title}" class="event-image lazy">`;
    }

    eventDiv.innerHTML = `
        <h2>${event.title}</h2>
        <h3>${event.description}</h3>
        <h4>${event.date}</h4>
        ${imageHtml}
        <p>${previewContent}<span class="more-text">${remainingContent}</span></p>
        ${remainingContent ? '<button class="show-more-btn" onclick="toggleText(this)">Show more</button>' : ''}
    `;
    container.appendChild(eventDiv);
}

// Initialize IntersectionObserver for lazy loading images
function setupLazyLoading() {
    const lazyImages = document.querySelectorAll('.lazy');
    const observer = new IntersectionObserver(async entries => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                const img = entry.target;
                const imageUrl = img.getAttribute('data-src');

                // Check if image exists before loading
                if (await imageExists(imageUrl)) {
                    img.src = imageUrl;
                    img.classList.remove('lazy');
                } else {
                    console.warn(`Image not found: ${imageUrl}`);
                }
                observer.unobserve(img);
            }
        }
    }, {
        rootMargin: "50px",
        threshold: 0.01
    });

    lazyImages.forEach(img => observer.observe(img));
}

// Helper function to check if an image URL is valid
async function imageExists(url) {
    if (!url) return false;
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch {
        return false;
    }
}

// Other unchanged helper functions
function createDateHeading(parent, date) {
    const dateHeading = document.createElement('h3');
    dateHeading.textContent = date;
    parent.appendChild(dateHeading);
}

function createTOCEntry(event, list) {
    const tocItem = document.createElement('li');
    const tocLink = document.createElement('a');
    tocLink.href = `#${event.id}`;
    tocLink.textContent = event.title;

    tocLink.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById(event.id).scrollIntoView({
            behavior: 'smooth'
        });
        closeTOC();
    });

    tocItem.appendChild(tocLink);
    list.appendChild(tocItem);
}

function toggleText(button) {
    const allButtons = document.querySelectorAll('.show-more-btn');
    const moreText = button.previousElementSibling.querySelector('.more-text');

    allButtons.forEach(btn => {
        const otherText = btn.previousElementSibling.querySelector('.more-text');
        if (btn !== button && otherText) {
            otherText.classList.remove('open');
            btn.textContent = 'Show more';
        }
    });

    if (moreText.classList.contains('open')) {
        moreText.classList.remove('open');
        button.textContent = 'Show more';
    } else {
        moreText.classList.add('open');
        button.textContent = 'Show less';
    }
}

function toggleTOC() {
    const tocOverlay = document.getElementById('toc-overlay');
    tocOverlay.classList.toggle('active');
}

function closeTOC() {
    document.getElementById('toc-overlay').classList.remove('active');
}

loadEvents();

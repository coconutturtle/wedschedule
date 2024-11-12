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

        // Use DocumentFragment to batch DOM updates
        const tocFragment = document.createDocumentFragment();
        const eventFragment = document.createDocumentFragment();

        for (const [date, dateEvents] of Object.entries(groupedEvents)) {
            createDateHeading(tocFragment, date);
            const eventList = document.createElement('ul');

            // Parallel loading of event sections
            await Promise.all(
                dateEvents.map(async event => {
                    createTOCEntry(event, eventList);
                    await createEventSection(event, eventFragment);
                })
            );

            tocFragment.appendChild(eventList);
        }

        tocOverlayContent.appendChild(tocFragment);
        eventsContainer.appendChild(eventFragment);

        // Initiate lazy loading for images
        setupLazyLoading();
    } catch (error) {
        console.error("Error loading events:", error);
        // Optionally display an error message to users
    }
}

// Function to check if an image URL is valid
async function imageExists(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch {
        return false;
    }
}

// Function to create event section, with conditional image loading
async function createEventSection(event, container) {
    const eventDiv = document.createElement('div');
    eventDiv.classList.add('event');
    eventDiv.id = event.id;

    const sentences = event.content.match(/[^.!?]+[.!?]*/g) || [];
    const previewContent = sentences[0];
    const remainingContent = sentences.slice(1).join(' ');

    // Lazy-load images and add them conditionally
    let imageHtml = '';
    if (event.image && await imageExists(event.image)) {
        imageHtml = `<img data-src="${event.image}" alt="${event.title}" class="event-image lazy">`;  // Using data-src for lazy loading
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
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.getAttribute('data-src');  // Assign the actual src
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: "50px",
        threshold: 0.01
    });

    lazyImages.forEach(img => observer.observe(img));
}

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

    // Improved scroll behavior for smooth and precise scrolling
    tocLink.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById(event.id).scrollIntoView({
            behavior: 'smooth',
            block: 'start',   // Ensures the element aligns with the top of the viewport
            inline: 'nearest' // Center the element horizontally if needed
        });
        closeTOC();  // Close TOC after scrolling
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

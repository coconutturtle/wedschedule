async function loadEvents() {
    const response = await fetch('events.json');
    const events = await response.json();
    const tocOverlayContent = document.querySelector('.toc-content');
    const eventsContainer = document.getElementById('events-container');

    const groupedEvents = events.reduce((acc, event) => {
        if (!acc[event.date]) acc[event.date] = [];
        acc[event.date].push(event);
        return acc;
    }, {});

    for (const [date, events] of Object.entries(groupedEvents)) {
        createDateHeading(tocOverlayContent, date);
        const eventList = document.createElement('ul');

        events.forEach(event => {
            createTOCEntry(event, eventList);
            createEventSection(event, eventsContainer);
        });

        tocOverlayContent.appendChild(eventList);
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

async function createEventSection(event, container) {
    const eventDiv = document.createElement('div');
    eventDiv.classList.add('event');
    eventDiv.id = event.id;

    const sentences = event.content.match(/[^.!?]+[.!?]*/g) || [];
    const previewContent = sentences[0];
    const remainingContent = sentences.slice(1).join(' ');

    // Check if the image exists before adding the <img> tag
    let imageHtml = '';
    if (event.image && await imageExists(event.image)) {
        imageHtml = `<img src="${event.image}" alt="${event.title}" class="event-image">`;
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

    // Smooth scroll on link click
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

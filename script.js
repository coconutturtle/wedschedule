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
    tocLink.onclick = () => closeTOC();
    tocItem.appendChild(tocLink);
    list.appendChild(tocItem);
}

function createEventSection(event, container) {
    const eventDiv = document.createElement('div');
    eventDiv.classList.add('event');
    eventDiv.id = event.id;

    const sentences = event.content.match(/[^.!?]+[.!?]*/g) || [];
    const previewContent = sentences[0];
    const remainingContent = sentences.slice(1).join(' ');

    eventDiv.innerHTML = `
        <h2>${event.title}</h2>
        <h3>${event.date}</h3>
        <p>${previewContent}<span class="more-text" style="display: none;">${remainingContent}</span></p>
        ${remainingContent ? '<button class="show-more-btn" onclick="toggleText(this)">Show more</button>' : ''}
    `;
    container.appendChild(eventDiv);
}

function toggleText(button) {
    const allButtons = document.querySelectorAll('.show-more-btn');
    const moreText = button.previousElementSibling.querySelector('.more-text');
    allButtons.forEach(btn => {
        const otherText = btn.previousElementSibling.querySelector('.more-text');
        if (btn !== button && otherText) otherText.style.display = 'none';
        if (btn !== button) btn.textContent = 'Show more';
    });

    if (moreText.style.display === 'none' || moreText.style.display === '') {
        moreText.style.display = 'inline';
        button.textContent = 'Show less';
    } else {
        moreText.style.display = 'none';
        button.textContent = 'Show more';
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

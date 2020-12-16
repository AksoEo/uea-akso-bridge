import { iconsPathPrefix } from './globals';

export function renderRating(value, max, type, onClickValue) {
    const container = document.createElement('div');
    container.className = 'location-rating';

    for (let i = 0; i < max; i++) {
        const icon = document.createElement('span');
        icon.className = 'rating-icon';

        if (onClickValue) {
            const clickedValue = i + 1;
            icon.addEventListener('click', () => {
                onClickValue(clickedValue);
            });
        }

        if (Math.floor(value) !== value && Math.floor(value) === i) {
            // partial icon
            const partial = value - Math.floor(value);

            icon.classList.add('is-partial');
            const base = document.createElement('img');
            base.className = 'rating-icon-base';
            base.src = iconsPathPrefix + 'rating-' + type + '-empty.svg';
            const fill = document.createElement('span');
            fill.className = 'rating-icon-fill-container is-' + type;
            fill.dataset.fillPartial = Math.floor(partial * 10);
            const fillImg = document.createElement('img');
            fillImg.src = iconsPathPrefix + 'rating-' + type + '-filled.svg';
            fill.appendChild(fillImg);
            icon.appendChild(base);
            icon.appendChild(fill);
        } else if (i < value) {
            const img = document.createElement('img');
            img.src = iconsPathPrefix + 'rating-' + type + '-filled.svg';
            icon.appendChild(img);
        } else {
            const img = document.createElement('img');
            img.src = iconsPathPrefix + 'rating-' + type + '-empty.svg';
            icon.appendChild(img);
        }

        container.appendChild(icon);
    }

    return container;
}

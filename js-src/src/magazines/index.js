import './index.less';

function init() {
    if (window.history && window.history.pushState && window.Element.prototype.scrollIntoView) {
        const editionYearLinks = document.querySelectorAll('.edition-year-link');
        for (let i = 0; i < editionYearLinks.length; i++) {
            const link = editionYearLinks[i];
            link.addEventListener('click', e => {
                const href = link.getAttribute('href');
                if (!href.startsWith('#')) return;
                const target = document.getElementById(href.substr(1));
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth' });
                    setTimeout(() => {
                        target.classList.add('pulse');
                        setTimeout(() => {
                            target.classList.remove('pulse');
                        }, 1500);
                    }, 400);
                }
            });
        }
    }
}

if (document.readyState === 'complete') init();
else window.addEventListener('DOMContentLoaded', init);

import './index.less';
import '../form';

function init() {
    const selectionBoxes = document.querySelectorAll('.selection-box');
    for (let i = 0; i < selectionBoxes.length; i++) {
        const box = selectionBoxes[i];
        const input = document.getElementById(box.getAttribute('for'));
        if (input.type === 'radio') {
            // add ability to un-check a radio button
            box.addEventListener('click', (e) => {
                if (input.checked) {
                    e.preventDefault();
                    input.checked = false;
                }
            });
        }
    }
}

window.addEventListener('DOMContentLoaded', init);

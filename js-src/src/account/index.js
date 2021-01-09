import { account } from '../../../locale.ini';
import './index.less';

const locale = { account };

function init() {
    const hasMore = document.querySelector('.memberships-has-more');
    if (hasMore) {
        hasMore.innerHTML = '';
        const showMore = document.createElement('button');
        showMore.textContent = locale.account.memberships_show_more_items;
        hasMore.appendChild(showMore);

        const listNode = hasMore.parentNode.querySelector('.memberships-list');

        function renderCategory(item) {
            const node = document.createElement('li');
            node.className = 'membership-category';
            const nameLabel = document.createElement('div');
            nameLabel.textContent = item.name;
            nameLabel.className = 'category-name';
            node.appendChild(nameLabel);
            const years = document.createElement('ul');
            years.className = 'membership-years';
            node.appendChild(years);
            listNode.appendChild(node);
            return { node, years };
        }
        function renderYearItem(category, item) {
            const node = document.createElement('li');
            node.className = 'membership-year';
            if (item.lifetime) {
                node.classList.add('is-lifetime');
                node.textContent = locale.account.membership_lifetime_prefix + ' ' + item.year;
            } else {
                node.textContent = item.year;
            }
            category.years.appendChild(node);
            category.years.appendChild(document.createTextNode(' '));
        }

        const categoryNodes = [];
        function renderAdditionalItems(items) {
            for (const item of items) {
                if (!categoryNodes[item.categoryId]) {
                    categoryNodes[item.categoryId] = renderCategory(item);
                }
                renderYearItem(categoryNodes[item.categoryId], item);
            }
        }

        let offset = 0;
        function showMoreItems() {
            showMore.disabled = true;
            fetch(location.pathname + `?fetch_more_items_offset=${offset}`).then(result => {
                return result.json();
            }).then(result => {
                // if this is the first fetch, then we want to clear the server-rendered ones
                if (!offset) listNode.innerHTML = '';

                renderAdditionalItems(result.items);
                offset += result.items.length;

                if (!result.hasMore) {
                    hasMore.parentNode.removeChild(hasMore);
                }
            }).catch(error => {
                // TODO: handle error
                console.error(error);
            }).then(() => {
                showMore.disabled = false;
            });
        }

        showMore.addEventListener('click', showMoreItems);
    }
}

if (document.readyState === 'complete') init();
else window.addEventListener('DOMContentLoaded', init);

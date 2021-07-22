import { account } from '../../../locale.ini';
import './index.less';
import initAddressFields from '../registration/address-fields';

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
            const yearValues = [];
            return { node, years, item, yearValues };
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
            category.yearValues.push(item.year);
            category.years.appendChild(node);
            category.years.appendChild(document.createTextNode(' '));
        }
        function renderRenewButton(category) {
            const currentYear = new Date().getFullYear();
            const hasThisYear = category.yearValues.includes(currentYear);
            const couldRenew = (category.hasThisYear && category.item.availableNextYear) || category.item.availableThisYear;
            const canBeRenewed = !category.item.lifetime && couldRenew;

            if (canBeRenewed === !!category.renewButton) return;
            if (canBeRenewed && !category.renewButton) {
                category.renewButton = document.createElement('button');
                category.renewButton.className = 'category-renew-button';
                category.renewButton.textContent = locale.account.membership_category_renew;
                category.node.insertBefore(category.renewButton, category.node.firstChild);
            } else if (!canBeRenewed) {
                category.node.removeChild(category.renewButton);
                category.renewButton = null;
            }
        }

        const categoryNodes = {};
        function renderAdditionalItems(items) {
            for (const item of items) {
                if (!categoryNodes[item.categoryId]) {
                    categoryNodes[item.categoryId] = renderCategory(item);
                }
                renderYearItem(categoryNodes[item.categoryId], item);
            }

            for (const k in categoryNodes) {
                renderRenewButton(categoryNodes[k]);
            }
        }

        let offset = 0;
        function showMoreItems() {
            showMore.disabled = true;
            fetch(location.pathname + `?membership_more_items_offset=${offset}`).then(result => {
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

    initAddressFields();
}

if (document.readyState === 'complete') init();
else window.addEventListener('DOMContentLoaded', init);

class WishlistUI {
    constructor(storage) {
        this.storage = storage;
        this.currentEditingItem = null;
        this.currentEditingGiftCard = null;
        this.searchQuery = '';
        this.giftCardSearchQuery = '';
        this.filters = {
            category: '',
            priority: ''
        };
        this.giftCardFilters = {
            priority: ''
        };
        this.itemsPerPage = 6;
        this.currentPage = 1;
        this.allItems = [];

        this.initializeEventListeners();
        this.render();
    }

    initializeEventListeners() {
        // Export button
        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportData();
        });

        // Import button
        document.getElementById('import-btn').addEventListener('click', () => {
            this.triggerImport();
        });

        // Import file input
        document.getElementById('import-file-input').addEventListener('change', (e) => {
            this.handleImportFile(e);
        });

        // Add item button
        document.getElementById('add-item-btn').addEventListener('click', () => {
            this.openModal();
        });

        // Add gift card button
        document.getElementById('add-gift-card-btn').addEventListener('click', () => {
            this.openGiftCardModal();
        });

        // Add category buttons
        document.getElementById('add-category-btn').addEventListener('click', () => {
            this.openCategoryModal();
        });

        document.getElementById('add-category-btn-modal').addEventListener('click', () => {
            this.openCategoryModal();
        });

        // Modal close buttons - using event delegation for multiple modals
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close')) {
                // Close any open modal
                if (!document.getElementById('item-modal').classList.contains('hidden')) {
                    this.closeModal();
                } else if (!document.getElementById('gift-card-modal').classList.contains('hidden')) {
                    this.closeGiftCardModal();
                } else if (!document.getElementById('category-modal').classList.contains('hidden')) {
                    this.closeCategoryModal();
                }
            } else if (e.target.classList.contains('cancel-btn')) {
                // Close any open modal
                if (!document.getElementById('item-modal').classList.contains('hidden')) {
                    this.closeModal();
                } else if (!document.getElementById('gift-card-modal').classList.contains('hidden')) {
                    this.closeGiftCardModal();
                } else if (!document.getElementById('category-modal').classList.contains('hidden')) {
                    this.closeCategoryModal();
                }
            }
        });

        // Form submission
        document.getElementById('item-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveItem();
        });

        // Gift card form submission
        document.getElementById('gift-card-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveGiftCard();
        });

        // Category form submission
        document.getElementById('category-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCategory();
        });

        // Search
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.currentPage = 1; // Reset pagination
            this.render();
        });

        // Filters
        document.getElementById('category-filter').addEventListener('change', (e) => {
            this.filters.category = e.target.value;
            this.currentPage = 1; // Reset pagination
            this.render();
        });

        document.getElementById('priority-filter').addEventListener('change', (e) => {
            this.filters.priority = e.target.value;
            this.currentPage = 1; // Reset pagination
            this.render();
        });

        // Gift card search and filters
        document.getElementById('gift-card-search-input').addEventListener('input', (e) => {
            this.giftCardSearchQuery = e.target.value;
            this.renderGiftCards();
        });

        document.getElementById('gift-card-priority-filter').addEventListener('change', (e) => {
            this.giftCardFilters.priority = e.target.value;
            this.renderGiftCards();
        });


        // Click outside modal to close
        document.getElementById('item-modal').addEventListener('click', (e) => {
            if (e.target.id === 'item-modal') {
                this.closeModal();
            }
        });

        document.getElementById('gift-card-modal').addEventListener('click', (e) => {
            if (e.target.id === 'gift-card-modal') {
                this.closeGiftCardModal();
            }
        });

        document.getElementById('category-modal').addEventListener('click', (e) => {
            if (e.target.id === 'category-modal') {
                this.closeCategoryModal();
            }
        });
    }

    render() {
        this.renderMostWanted();
        this.renderWishlist();
        this.renderGiftCards();
        this.updateCategoryDropdowns();
    }

    renderMostWanted() {
        const container = document.getElementById('most-wanted-grid');
        const mostWantedItems = this.storage.getMostWantedItems();

        if (mostWantedItems.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No Most Wanted Items</h3>
                    <p>Mark items as high priority to add them to your most wanted list!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = mostWantedItems.map(item => this.createItemCard(item)).join('');
    }

    renderWishlist() {
        const container = document.getElementById('wishlist-grid');
        let items = this.storage.getAllItems();

        // Apply search
        if (this.searchQuery) {
            items = this.storage.searchItems(this.searchQuery);
        }

        // Apply filters
        items = this.storage.filterItems(this.filters);

        // Filter out high priority items from main list UNLESS user is using filters
        const hasActiveFilters = this.filters.priority || this.filters.category || this.searchQuery;
        if (!hasActiveFilters) {
            items = items.filter(item => item.priority !== 'high');
        }

        // Sort items - Top Pick items first, then by priority (high to low)
        items.sort((a, b) => {
            // First, sort by favorite status (Top Pick items first)
            if (a.favorite && !b.favorite) return -1;
            if (!a.favorite && b.favorite) return 1;

            // If both have same favorite status, sort by priority
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });

        this.allItems = items;

        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No Items Found</h3>
                    <p>Try adjusting your search or filters, or add some items to your wishlist!</p>
                </div>
            `;
            return;
        }

        // Show only items for current page
        const startIndex = 0;
        const endIndex = this.currentPage * this.itemsPerPage;
        const visibleItems = items.slice(startIndex, endIndex);

        container.innerHTML = visibleItems.map(item => this.createItemCard(item)).join('');

        // Add load more button if there are more items
        this.updateLoadMoreButton(items.length, visibleItems.length);
    }

    updateLoadMoreButton(totalItems, visibleItems) {
        const existingButton = document.getElementById('load-more-btn');
        if (existingButton) {
            existingButton.remove();
        }

        if (visibleItems < totalItems) {
            const button = document.createElement('button');
            button.id = 'load-more-btn';
            button.className = 'load-more-btn';
            button.textContent = `Load More (${totalItems - visibleItems} remaining)`;
            button.addEventListener('click', () => {
                this.loadMoreItems();
            });

            const wishlistSection = document.getElementById('wishlist-section');
            wishlistSection.appendChild(button);
        }
    }

    loadMoreItems() {
        this.currentPage++;
        this.renderWishlist();
    }

    createItemCard(item) {
        const selectedVariant = item.variants[0] || {};
        const priorityClass = `priority-${item.priority}`;
        const favoriteClass = item.favorite ? 'active' : '';

        return `
            <div class="item-card ${priorityClass}" data-item-id="${item.id}">
                ${item.favorite ? '<div class="favorite-sticker">TOP PICK</div>' : ''}
                ${item.image
                    ? `<img src="${item.image}" alt="${item.name}" class="item-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
                    : ''
                }
                <div class="item-placeholder" style="${item.image ? 'display: none;' : ''}">
                    📦
                </div>

                <div class="hover-info">
                    <h4>${this.escapeHtml(item.name)}</h4>
                    <div class="info-item">
                        <span class="info-label">Color:</span> ${selectedVariant.color || 'Not specified'}
                    </div>
                    <div class="info-item">
                        <span class="info-label">Size:</span> ${selectedVariant.size || 'Not specified'}
                    </div>
                    <div class="info-item">
                        <span class="info-label">Shop:</span> ${selectedVariant.storeName || 'Not specified'}
                    </div>
                    <div class="info-item">
                        <span class="info-label">Price:</span> ${selectedVariant.price || 'Not specified'}
                    </div>
                </div>

                <div class="item-header">
                    <h3 class="item-name">${this.escapeHtml(item.name)}</h3>
                    <div class="item-actions">
                        <button class="edit-btn" data-action="edit" data-item-id="${item.id}" title="Edit Item">
                            ✏️
                        </button>
                        <button class="delete-btn" data-action="delete" data-item-id="${item.id}" title="Delete Item">
                            🗑️
                        </button>
                    </div>
                </div>

                ${item.description ? `<p class="item-description">${this.escapeHtml(item.description)}</p>` : ''}

                ${item.variants.length > 1 ? `
                    <div class="item-variants">
                        <select class="variant-selector" data-item-id="${item.id}">
                            ${item.variants.map((variant, index) => `
                                <option value="${index}" ${index === 0 ? 'selected' : ''}>
                                    ${variant.color || 'No Color'} - ${variant.storeName || 'No Store'} - ${variant.price || 'No Price'}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                ` : ''}

                <div class="item-meta">
                    <span class="item-price">${selectedVariant.price || 'No price'}</span>
                    <span class="item-category">${item.category}</span>
                </div>
            </div>
        `;
    }

    openModal(item = null) {
        this.currentEditingItem = item;
        const modal = document.getElementById('item-modal');
        const form = document.getElementById('item-form');
        const title = document.getElementById('modal-title');

        if (item) {
            title.textContent = 'Edit Item';
            this.populateForm(item);
        } else {
            title.textContent = 'Add New Item';
            form.reset();
            this.resetModalState();
        }

        modal.classList.remove('hidden');
    }

    resetModalState() {
        // Form is now simplified - nothing to reset
    }

    closeModal() {
        const modal = document.getElementById('item-modal');
        modal.classList.add('hidden');
        this.currentEditingItem = null;
    }

    populateForm(item) {
        // Populate the form fields
        document.getElementById('item-name').value = item.name;
        document.getElementById('item-category').value = item.category;
        document.getElementById('item-priority').value = item.priority;
        document.getElementById('item-color').value = item.variants[0]?.color || '';
        document.getElementById('item-size').value = item.variants[0]?.size || '';
        document.getElementById('item-store').value = item.variants[0]?.storeName || '';
        document.getElementById('item-price').value = item.variants[0]?.price || '';
        document.getElementById('item-link').value = item.variants[0]?.link || '';
        document.getElementById('item-image').value = item.image || '';
        document.getElementById('item-top-pick').checked = item.favorite || false;
    }

    saveItem() {
        // Get all form data
        const formData = {
            name: document.getElementById('item-name').value.trim(),
            description: '',
            category: document.getElementById('item-category').value,
            priority: document.getElementById('item-priority').value,
            favorite: document.getElementById('item-top-pick').checked,
            image: document.getElementById('item-image').value.trim(),
            variants: [{
                color: document.getElementById('item-color').value.trim(),
                size: document.getElementById('item-size').value.trim(),
                price: document.getElementById('item-price').value.trim(),
                link: document.getElementById('item-link').value.trim(),
                storeName: document.getElementById('item-store').value.trim()
            }]
        };

        if (!formData.name) {
            alert('Please enter an item name');
            return;
        }

        if (!formData.variants[0].link) {
            alert('Please enter a product link');
            return;
        }

        if (this.currentEditingItem) {
            this.storage.updateItem(this.currentEditingItem.id, formData);
        } else {
            this.storage.addItem(formData);
        }

        this.closeModal();
        this.render();
    }

    getVariantsFromForm() {
        const variants = [];
        const variantForms = document.querySelectorAll('.variant-form');

        variantForms.forEach(form => {
            const color = form.querySelector('[name="variant-color"]').value.trim();
            const size = form.querySelector('[name="variant-size"]').value.trim();
            const price = form.querySelector('[name="variant-price"]').value.trim();
            const link = form.querySelector('[name="variant-link"]').value.trim();
            const storeName = form.querySelector('[name="variant-store"]').value.trim();

            variants.push({
                color: color || '',
                size: size || '',
                price: price || '',
                link: link || '',
                storeName: storeName || ''
            });
        });

        return variants.length > 0 ? variants : [{ color: '', size: '', price: '', link: '', storeName: '' }];
    }

    addVariantForm(variant = null) {
        const container = document.getElementById('variants-container');
        const variantCount = container.children.length + 1;

        const variantHtml = `
            <div class="variant-form">
                <h4>Variant ${variantCount}
                    <button type="button" class="remove-variant-btn" onclick="this.parentElement.parentElement.remove()">Remove</button>
                </h4>
                <div class="form-row">
                    <div class="form-group">
                        <label>Color:</label>
                        <input type="text" name="variant-color" value="${variant?.color || ''}" placeholder="e.g., Red, Blue">
                    </div>
                    <div class="form-group">
                        <label>Size:</label>
                        <input type="text" name="variant-size" value="${variant?.size || ''}" placeholder="e.g., M, L, XL">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Price:</label>
                        <input type="text" name="variant-price" value="${variant?.price || ''}" placeholder="e.g., $29.99">
                    </div>
                    <div class="form-group">
                        <label>Store Name:</label>
                        <input type="text" name="variant-store" value="${variant?.storeName || ''}" placeholder="e.g., Amazon, Target">
                    </div>
                </div>
                <div class="form-row full-width">
                    <div class="form-group">
                        <label>Store Link:</label>
                        <input type="url" name="variant-link" value="${variant?.link || ''}" placeholder="https://store.com/item">
                    </div>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', variantHtml);
    }

    clearVariants() {
        document.getElementById('variants-container').innerHTML = '';
    }

    handleItemAction(e) {
        const action = e.target.dataset.action;
        const itemId = e.target.dataset.itemId;

        if (!action || !itemId) return;

        e.stopPropagation();

        switch (action) {
            case 'edit':
                const item = this.storage.getItemById(itemId);
                if (item) {
                    this.openModal(item);
                }
                break;
            case 'delete':
                if (confirm('Are you sure you want to delete this item?')) {
                    this.storage.deleteItem(itemId);
                    this.render();
                }
                break;
        }
    }

    handleVariantChange(e) {
        const itemId = e.target.dataset.itemId;
        const variantIndex = parseInt(e.target.value);
        const item = this.storage.getItemById(itemId);

        if (item && item.variants[variantIndex]) {
            const itemCard = e.target.closest('.item-card');
            const selectedVariant = item.variants[variantIndex];

            // Update the price display for this item
            const priceElement = itemCard.querySelector('.item-price');
            priceElement.textContent = selectedVariant.price || 'No price';

            // Update the hover info overlay
            const hoverInfo = itemCard.querySelector('.hover-info');
            if (hoverInfo) {
                hoverInfo.innerHTML = `
                    <h4>${this.escapeHtml(item.name)}</h4>
                    <div class="info-item">
                        <span class="info-label">Color:</span> ${selectedVariant.color || 'Not specified'}
                    </div>
                    <div class="info-item">
                        <span class="info-label">Size:</span> ${selectedVariant.size || 'Not specified'}
                    </div>
                    <div class="info-item">
                        <span class="info-label">Shop:</span> ${selectedVariant.storeName || 'Not specified'}
                    </div>
                    <div class="info-item">
                        <span class="info-label">Price:</span> ${selectedVariant.price || 'Not specified'}
                    </div>
                `;
            }
        }
    }

    handleItemClick(e) {
        // Don't trigger if clicking on action buttons or variant selector
        if (e.target.closest('.item-actions') || e.target.closest('.variant-selector')) {
            return;
        }

        const itemCard = e.target.closest('.item-card');
        if (!itemCard) return;

        const itemId = itemCard.dataset.itemId;
        const item = this.storage.getItemById(itemId);

        if (item && item.variants.length > 0) {
            const variantSelector = itemCard.querySelector('.variant-selector');
            const selectedIndex = variantSelector ? parseInt(variantSelector.value) : 0;
            const selectedVariant = item.variants[selectedIndex];

            if (selectedVariant && selectedVariant.link) {
                // Add visual feedback before opening link
                itemCard.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    itemCard.style.transform = '';
                }, 150);

                // Open the link
                window.open(selectedVariant.link, '_blank', 'noopener,noreferrer');
            } else {
                // Show a more helpful message
                const storeName = selectedVariant?.storeName || 'this variant';
                alert(`No store link available for ${storeName}. Please add a link by editing this item.`);
            }
        } else {
            alert('No variants available for this item. Please edit the item to add store links.');
        }
    }

    // Gift Card Methods
    renderGiftCards() {
        const container = document.getElementById('gift-cards-grid');
        let giftCards = this.storage.getAllGiftCards();

        // Apply search
        if (this.giftCardSearchQuery) {
            giftCards = this.storage.searchGiftCards(this.giftCardSearchQuery);
        }

        // Apply priority filter
        if (this.giftCardFilters.priority) {
            giftCards = giftCards.filter(card => card.priority === this.giftCardFilters.priority);
        }

        if (giftCards.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No Gift Cards Found</h3>
                    <p>Try adjusting your search or filters, or add some gift cards!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = giftCards.map(card => this.createGiftCard(card)).join('');
    }

    createGiftCard(card) {
        const priorityClass = `priority-${card.priority}`;

        return `
            <div class="gift-card ${priorityClass}" data-card-id="${card.id}">
                ${card.image
                    ? `<img src="${card.image}" alt="${card.name}" class="gift-card-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
                    : ''
                }
                <div class="gift-card-icon" style="${card.image ? 'display: none;' : ''}">🎁</div>

                <div class="hover-info">
                    <h4>${this.escapeHtml(card.name)}</h4>
                    <div class="info-item">
                        <span class="info-label">Notes:</span> ${card.notes || 'No notes'}
                    </div>
                    <div class="info-item">
                        <span class="info-label">Priority:</span> ${card.priority}
                    </div>
                    ${card.link ? `<div class="info-item"><span class="info-label">Click to visit store</span></div>` : ''}
                </div>

                <div class="gift-card-name">${this.escapeHtml(card.name)}</div>

                ${card.notes ? `<div class="gift-card-notes">${this.escapeHtml(card.notes)}</div>` : ''}

                <div class="gift-card-actions">
                    <button data-action="edit-gift-card" data-card-id="${card.id}" title="Edit Gift Card">✏️</button>
                    <button data-action="delete-gift-card" data-card-id="${card.id}" title="Delete Gift Card">🗑️</button>
                </div>
            </div>
        `;
    }

    openGiftCardModal(card = null) {
        this.currentEditingGiftCard = card;
        const modal = document.getElementById('gift-card-modal');
        const form = document.getElementById('gift-card-form');
        const title = document.getElementById('gift-card-modal-title');

        if (card) {
            title.textContent = 'Edit Gift Card';
            this.populateGiftCardForm(card);
        } else {
            title.textContent = 'Add New Gift Card';
            form.reset();
        }

        modal.classList.remove('hidden');
    }

    closeGiftCardModal() {
        const modal = document.getElementById('gift-card-modal');
        modal.classList.add('hidden');
        this.currentEditingGiftCard = null;
    }

    populateGiftCardForm(card) {
        document.getElementById('gift-card-name').value = card.name;
        document.getElementById('gift-card-image').value = card.image;
        document.getElementById('gift-card-link').value = card.link;
        document.getElementById('gift-card-notes').value = card.notes;
        document.getElementById('gift-card-priority').value = card.priority;
    }

    saveGiftCard() {
        const formData = {
            name: document.getElementById('gift-card-name').value.trim(),
            image: document.getElementById('gift-card-image').value.trim(),
            link: document.getElementById('gift-card-link').value.trim(),
            notes: document.getElementById('gift-card-notes').value.trim(),
            priority: document.getElementById('gift-card-priority').value
        };

        if (!formData.name) {
            alert('Please enter a store/brand name');
            return;
        }

        if (this.currentEditingGiftCard) {
            this.storage.updateGiftCard(this.currentEditingGiftCard.id, formData);
        } else {
            this.storage.addGiftCard(formData);
        }

        this.closeGiftCardModal();
        this.render();
    }

    handleGiftCardAction(e) {
        const action = e.target.dataset.action;
        const cardId = e.target.dataset.cardId;

        if (!action || !cardId) return;

        e.stopPropagation();

        switch (action) {
            case 'edit-gift-card':
                const card = this.storage.getGiftCardById(cardId);
                if (card) {
                    this.openGiftCardModal(card);
                }
                break;
            case 'delete-gift-card':
                if (confirm('Are you sure you want to delete this gift card?')) {
                    this.storage.deleteGiftCard(cardId);
                    this.render();
                }
                break;
        }
    }

    handleGiftCardClick(e) {
        // Don't trigger if clicking on action buttons
        if (e.target.closest('.gift-card-actions')) {
            return;
        }

        const giftCard = e.target.closest('.gift-card');
        if (!giftCard) return;

        const cardId = giftCard.dataset.cardId;
        const card = this.storage.getGiftCardById(cardId);

        if (card && card.link) {
            // Add visual feedback before opening link
            giftCard.style.transform = 'scale(0.98)';
            setTimeout(() => {
                giftCard.style.transform = '';
            }, 150);

            // Open the link
            window.open(card.link, '_blank', 'noopener,noreferrer');
        } else {
            alert('No purchase link available for this gift card. Please edit to add a link.');
        }
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Export data functionality
    exportData() {
        window.wishlistApp.exportData();
    }

    // Trigger file input for import
    triggerImport() {
        document.getElementById('import-file-input').click();
    }

    // Handle import file selection
    handleImportFile(event) {
        const file = event.target.files[0];
        if (file) {
            window.wishlistApp.importData(file);
            // Reset the file input so the same file can be selected again
            event.target.value = '';
        }
    }

    // Category management methods
    updateCategoryDropdowns() {
        const categories = this.storage.getAllCategories();
        const categoryFilter = document.getElementById('category-filter');
        const itemCategory = document.getElementById('item-category');

        // Save current selections
        const filterValue = categoryFilter.value;
        const itemValue = itemCategory.value;

        // Update category filter dropdown
        categoryFilter.innerHTML = '<option value="">All Categories</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            categoryFilter.appendChild(option);
        });

        // Update item category dropdown
        itemCategory.innerHTML = '';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            itemCategory.appendChild(option);
        });

        // Restore selections if they still exist
        if (categories.includes(filterValue)) {
            categoryFilter.value = filterValue;
        }
        if (categories.includes(itemValue)) {
            itemCategory.value = itemValue;
        }
    }

    openCategoryModal() {
        const modal = document.getElementById('category-modal');
        const form = document.getElementById('category-form');
        form.reset();
        modal.classList.remove('hidden');
    }

    closeCategoryModal() {
        const modal = document.getElementById('category-modal');
        modal.classList.add('hidden');
    }

    saveCategory() {
        const categoryName = document.getElementById('category-name').value.trim();

        if (!categoryName) {
            alert('Please enter a category name');
            return;
        }

        if (categoryName.length > 20) {
            alert('Category name must be 20 characters or less');
            return;
        }

        if (this.storage.addCategory(categoryName)) {
            this.closeCategoryModal();
            this.updateCategoryDropdowns();
            alert(`Category "${categoryName}" added successfully!`);
        } else {
            alert('This category already exists');
        }
    }
}

// Initialize event delegation for dynamic content
document.addEventListener('click', (e) => {
    // Handle item actions
    if (e.target.dataset.action && !e.target.dataset.action.includes('gift-card')) {
        window.wishlistUI.handleItemAction(e);
    }
    // Handle gift card actions
    else if (e.target.dataset.action && e.target.dataset.action.includes('gift-card')) {
        window.wishlistUI.handleGiftCardAction(e);
    }
    // Handle item clicks for navigation
    else if (e.target.closest('.item-card')) {
        window.wishlistUI.handleItemClick(e);
    }
    // Handle gift card clicks for navigation
    else if (e.target.closest('.gift-card')) {
        window.wishlistUI.handleGiftCardClick(e);
    }
});

// Handle variant selector changes
document.addEventListener('change', (e) => {
    if (e.target.classList.contains('variant-selector')) {
        window.wishlistUI.handleVariantChange(e);
    }
});
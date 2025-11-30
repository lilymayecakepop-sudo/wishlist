class VariantManager {
    constructor() {
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Handle variant selection changes with enhanced feedback
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('variant-selector')) {
                this.handleVariantChange(e);
            }
        });

        // Handle hover effects on variant selectors
        document.addEventListener('mouseenter', (e) => {
            if (e.target.classList.contains('variant-selector')) {
                this.handleVariantHover(e);
            }
        }, true);
    }

    handleVariantChange(e) {
        const selector = e.target;
        const itemId = selector.dataset.itemId;
        const variantIndex = parseInt(selector.value);
        const item = window.wishlistStorage.getItemById(itemId);

        if (!item || !item.variants[variantIndex]) return;

        const selectedVariant = item.variants[variantIndex];
        const itemCard = selector.closest('.item-card');

        // Update the item card display with new variant info
        this.updateItemCardDisplay(itemCard, selectedVariant);

        // Add visual feedback for the change
        this.addChangeAnimation(itemCard);

        // Show tooltip for the selected variant
        if (window.tooltipManager) {
            setTimeout(() => {
                window.tooltipManager.showVariantTooltip(itemId, variantIndex, selector);
            }, 100);
        }
    }

    updateItemCardDisplay(itemCard, variant) {
        // Update price display
        const priceElement = itemCard.querySelector('.item-price');
        if (priceElement) {
            priceElement.textContent = variant.price || 'No price';

            // Add a subtle animation to highlight the change
            priceElement.style.transition = 'color 0.3s ease';
            priceElement.style.color = '#FF6B6B';
            setTimeout(() => {
                priceElement.style.color = '#4CAF50';
            }, 300);
        }

        // Update any other variant-specific displays
        this.updateVariantIndicators(itemCard, variant);
    }

    updateVariantIndicators(itemCard, variant) {
        // Add or update color indicator if it doesn't exist
        let colorIndicator = itemCard.querySelector('.variant-color-indicator');

        if (!colorIndicator && variant.color) {
            colorIndicator = document.createElement('div');
            colorIndicator.className = 'variant-color-indicator';
            colorIndicator.style.cssText = `
                width: 16px;
                height: 16px;
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 0 0 1px rgba(0,0,0,0.1);
                position: absolute;
                top: 10px;
                right: 50px;
                z-index: 10;
            `;
            itemCard.style.position = 'relative';
            itemCard.appendChild(colorIndicator);
        }

        if (colorIndicator && variant.color) {
            if (this.isValidColor(variant.color)) {
                colorIndicator.style.backgroundColor = variant.color;
            } else {
                colorIndicator.style.background = 'linear-gradient(45deg, #ccc, #999)';
            }
            colorIndicator.title = `Color: ${variant.color}`;
        }
    }

    addChangeAnimation(itemCard) {
        itemCard.style.transition = 'transform 0.2s ease';
        itemCard.style.transform = 'scale(1.02)';

        setTimeout(() => {
            itemCard.style.transform = 'scale(1)';
        }, 200);
    }

    handleVariantHover(e) {
        const selector = e.target;
        const itemId = selector.dataset.itemId;
        const item = window.wishlistStorage.getItemById(itemId);

        if (!item) return;

        // Create enhanced options with preview info
        this.enhanceSelectOptions(selector, item.variants);
    }

    enhanceSelectOptions(selector, variants) {
        // This method could be used to add preview functionality
        // For now, we'll just ensure the options are properly formatted
        if (selector.children.length !== variants.length) {
            selector.innerHTML = variants.map((variant, index) => {
                const colorText = variant.color || 'No Color';
                const storeText = variant.storeName || 'No Store';
                const priceText = variant.price || 'No Price';

                return `<option value="${index}">${colorText} - ${storeText} - ${priceText}</option>`;
            }).join('');
        }
    }

    isValidColor(color) {
        const testElement = document.createElement('div');
        testElement.style.color = color;
        return testElement.style.color !== '' || CSS.supports('color', color);
    }

    // Method to get the currently selected variant for an item
    getSelectedVariant(itemId) {
        const itemCard = document.querySelector(`[data-item-id="${itemId}"]`);
        if (!itemCard) return null;

        const selector = itemCard.querySelector('.variant-selector');
        if (!selector) return null;

        const variantIndex = parseInt(selector.value) || 0;
        const item = window.wishlistStorage.getItemById(itemId);

        return item?.variants[variantIndex] || null;
    }

    // Method to programmatically select a variant
    selectVariant(itemId, variantIndex) {
        const itemCard = document.querySelector(`[data-item-id="${itemId}"]`);
        if (!itemCard) return false;

        const selector = itemCard.querySelector('.variant-selector');
        if (!selector) return false;

        selector.value = variantIndex;
        selector.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
    }

    // Method to add variant-specific styling to item cards
    applyVariantStyling(itemCard, variant) {
        // Remove existing variant classes
        itemCard.classList.remove('variant-available', 'variant-expensive', 'variant-cheap');

        if (!variant) return;

        // Add class if variant has a link (available for purchase)
        if (variant.link) {
            itemCard.classList.add('variant-available');
        }

        // Add price-based styling
        if (variant.price) {
            const priceValue = this.extractPriceValue(variant.price);
            if (priceValue > 100) {
                itemCard.classList.add('variant-expensive');
            } else if (priceValue < 20) {
                itemCard.classList.add('variant-cheap');
            }
        }
    }

    extractPriceValue(priceString) {
        if (!priceString) return 0;
        const matches = priceString.match(/[\d.]+/);
        return matches ? parseFloat(matches[0]) : 0;
    }
}

// Initialize variant manager
document.addEventListener('DOMContentLoaded', () => {
    window.variantManager = new VariantManager();
});

// CSS for variant-specific styling (injected dynamically)
const variantStyles = `
    .variant-available {
        border-left: 3px solid #4CAF50;
    }

    .variant-expensive .item-price {
        color: #f44336;
        font-weight: bold;
    }

    .variant-cheap .item-price {
        color: #4CAF50;
        font-weight: bold;
    }

    .variant-color-indicator {
        transition: all 0.3s ease;
    }

    .item-card:hover .variant-color-indicator {
        transform: scale(1.1);
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = variantStyles;
document.head.appendChild(styleSheet);
class TooltipManager {
    constructor() {
        this.tooltip = document.getElementById('tooltip');
        this.isVisible = false;
        this.currentTarget = null;
        this.hideTimeout = null;

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Use event delegation for dynamic content
        document.addEventListener('mouseenter', (e) => {
            if (e.target.closest('.item-card')) {
                this.handleMouseEnter(e);
            }
        }, true);

        document.addEventListener('mouseleave', (e) => {
            if (e.target.closest('.item-card')) {
                this.handleMouseLeave(e);
            }
        }, true);

        document.addEventListener('mousemove', (e) => {
            if (this.isVisible) {
                this.updateTooltipPosition(e);
            }
        });

        // Hide tooltip when scrolling
        document.addEventListener('scroll', () => {
            this.hideTooltip();
        }, true);

        // Hide tooltip when clicking
        document.addEventListener('click', () => {
            this.hideTooltip();
        });
    }

    handleMouseEnter(e) {
        const itemCard = e.target.closest('.item-card');
        if (!itemCard) return;

        clearTimeout(this.hideTimeout);

        const itemId = itemCard.dataset.itemId;
        const item = window.wishlistStorage.getItemById(itemId);

        if (!item || !item.variants || item.variants.length === 0) {
            return;
        }

        // Get the selected variant
        const variantSelector = itemCard.querySelector('.variant-selector');
        const selectedIndex = variantSelector ? parseInt(variantSelector.value) : 0;
        const selectedVariant = item.variants[selectedIndex] || item.variants[0];

        if (!selectedVariant) return;

        this.currentTarget = itemCard;
        this.showTooltip(selectedVariant, e);
    }

    handleMouseLeave(e) {
        const itemCard = e.target.closest('.item-card');
        if (itemCard === this.currentTarget) {
            this.hideTimeout = setTimeout(() => {
                this.hideTooltip();
            }, 150); // Small delay to prevent flickering
        }
    }

    showTooltip(variant, mouseEvent) {
        if (!variant) return;

        const colorDisplay = variant.color || 'No color specified';
        const sizeDisplay = variant.size || 'No size specified';
        const priceDisplay = variant.price || 'No price';
        const storeDisplay = variant.storeName || 'No store specified';

        // Update tooltip content
        const colorElement = this.tooltip.querySelector('.tooltip-color');
        const colorTextElement = this.tooltip.querySelector('.tooltip-color-text');
        const sizeElement = this.tooltip.querySelector('.tooltip-size');
        const priceElement = this.tooltip.querySelector('.tooltip-price');
        const storeElement = this.tooltip.querySelector('.tooltip-store');

        // Set color swatch
        if (variant.color && this.isValidColor(variant.color)) {
            colorElement.style.backgroundColor = variant.color;
            colorElement.style.border = '2px solid white';
        } else {
            // Use a gradient for unknown colors or show a default
            colorElement.style.background = 'linear-gradient(45deg, #ccc, #999)';
            colorElement.style.border = '2px solid white';
        }

        // Set text content
        colorTextElement.textContent = `Color: ${colorDisplay}`;
        sizeElement.textContent = `Size: ${sizeDisplay}`;
        priceElement.textContent = priceDisplay;
        storeElement.textContent = `Available at: ${storeDisplay}`;

        // Show tooltip
        this.tooltip.classList.remove('hidden');
        this.tooltip.classList.add('visible');
        this.isVisible = true;

        // Position tooltip
        this.updateTooltipPosition(mouseEvent);
    }

    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.classList.remove('visible');
            this.tooltip.classList.add('hidden');
        }
        this.isVisible = false;
        this.currentTarget = null;
        clearTimeout(this.hideTimeout);
    }

    updateTooltipPosition(mouseEvent) {
        if (!this.isVisible || !this.tooltip) return;

        const tooltipRect = this.tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Position tooltip directly at mouse cursor
        let x = mouseEvent.clientX;
        let y = mouseEvent.clientY;

        // Adjust if tooltip goes off screen horizontally
        if (x + tooltipRect.width > viewportWidth) {
            x = mouseEvent.clientX - tooltipRect.width;
        }

        // Adjust if tooltip goes off screen vertically
        if (y + tooltipRect.height > viewportHeight) {
            y = mouseEvent.clientY - tooltipRect.height;
        }

        // Make sure tooltip doesn't go off the left edge
        if (x < 0) {
            x = 5;
        }

        // Make sure tooltip doesn't go off the top edge
        if (y < 0) {
            y = 5;
        }

        this.tooltip.style.left = `${x}px`;
        this.tooltip.style.top = `${y}px`;
    }

    isValidColor(color) {
        // Check if it's a valid CSS color
        const testElement = document.createElement('div');
        testElement.style.color = color;
        return testElement.style.color !== '';
    }

    // Method to show tooltip for variant selector changes
    showVariantTooltip(itemId, variantIndex, element) {
        const item = window.wishlistStorage.getItemById(itemId);
        if (!item || !item.variants[variantIndex]) return;

        const variant = item.variants[variantIndex];
        const rect = element.getBoundingClientRect();

        // Create a mock mouse event for positioning
        const mockEvent = {
            clientX: rect.left + rect.width / 2,
            clientY: rect.top
        };

        this.showTooltip(variant, mockEvent);

        // Auto-hide after a delay
        setTimeout(() => {
            this.hideTooltip();
        }, 2000);
    }
}

// Enhanced variant selector behavior with tooltips
document.addEventListener('change', (e) => {
    if (e.target.classList.contains('variant-selector')) {
        const itemId = e.target.dataset.itemId;
        const variantIndex = parseInt(e.target.value);

        // Show tooltip for the selected variant
        if (window.tooltipManager) {
            setTimeout(() => {
                window.tooltipManager.showVariantTooltip(itemId, variantIndex, e.target);
            }, 100);
        }
    }
});

// Initialize tooltip manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.tooltipManager = new TooltipManager();
});
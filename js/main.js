// Main application initialization and coordination
class WishlistApp {
    constructor() {
        this.storage = window.wishlistStorage;
        this.ui = null;
        this.tooltipManager = null;
        this.variantManager = null;

        this.initializeApp();
    }

    initializeApp() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupApp();
            });
        } else {
            this.setupApp();
        }
    }

    setupApp() {
        // Initialize managers
        this.variantManager = window.variantManager || new VariantManager();

        // Initialize UI
        this.ui = new WishlistUI(this.storage);

        // Set global reference
        window.wishlistUI = this.ui;

        // Update category dropdowns on initial load
        this.ui.updateCategoryDropdowns();

        // Add sample data if storage is empty
        this.addSampleDataIfEmpty();

        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();

        // Setup periodic auto-save (in case of crashes)
        this.setupAutoSave();

        console.log('Wishlist app initialized successfully!');
    }

    addSampleDataIfEmpty() {
        if (this.storage.getAllItems().length === 0) {
            const sampleItems = [
                {
                    name: "Wireless Bluetooth Headphones",
                    description: "High-quality noise-cancelling headphones perfect for music and calls",
                    category: "electronics",
                    priority: "high",
                    mostWanted: true,
                    image: "",
                    variants: [
                        {
                            color: "Black",
                            size: "",
                            price: "$149.99",
                            link: "https://example.com/headphones-black",
                            storeName: "Amazon"
                        },
                        {
                            color: "White",
                            size: "",
                            price: "$159.99",
                            link: "https://example.com/headphones-white",
                            storeName: "Best Buy"
                        },
                        {
                            color: "Blue",
                            size: "",
                            price: "$144.99",
                            link: "https://example.com/headphones-blue",
                            storeName: "Target"
                        }
                    ]
                },
                {
                    name: "Cozy Winter Sweater",
                    description: "Soft wool sweater perfect for cold weather",
                    category: "clothing",
                    priority: "medium",
                    mostWanted: true,
                    image: "",
                    variants: [
                        {
                            color: "Red",
                            size: "Medium",
                            price: "$49.99",
                            link: "https://example.com/sweater-red-m",
                            storeName: "H&M"
                        },
                        {
                            color: "Navy",
                            size: "Large",
                            price: "$52.99",
                            link: "https://example.com/sweater-navy-l",
                            storeName: "Uniqlo"
                        }
                    ]
                },
                {
                    name: "Programming Book Collection",
                    description: "Essential books for learning modern web development",
                    category: "books",
                    priority: "low",
                    mostWanted: false,
                    image: "",
                    variants: [
                        {
                            color: "",
                            size: "",
                            price: "$89.99",
                            link: "https://example.com/book-collection",
                            storeName: "Amazon"
                        }
                    ]
                },
                {
                    name: "Smart Home Speaker",
                    description: "Voice-controlled smart speaker with excellent sound quality",
                    category: "electronics",
                    priority: "medium",
                    mostWanted: false,
                    image: "",
                    variants: [
                        {
                            color: "Black",
                            size: "",
                            price: "$79.99",
                            link: "https://example.com/speaker-black",
                            storeName: "Amazon"
                        },
                        {
                            color: "White",
                            size: "",
                            price: "$79.99",
                            link: "https://example.com/speaker-white",
                            storeName: "Google Store"
                        }
                    ]
                }
            ];

            sampleItems.forEach(item => {
                this.storage.addItem(item);
            });

            console.log('Added sample data to empty wishlist');
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only trigger shortcuts when not typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            switch (e.key) {
                case 'n':
                case 'N':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.ui.openModal();
                    }
                    break;
                case 'Escape':
                    this.ui.closeModal();
                    break;
                case '/':
                    e.preventDefault();
                    document.getElementById('search-input').focus();
                    break;
            }
        });
    }

    setupAutoSave() {
        // Save data every 30 seconds as a backup
        setInterval(() => {
            this.storage.saveItems();
            this.storage.saveGiftCards();
        }, 30000);

        // Save before page unload
        window.addEventListener('beforeunload', () => {
            this.storage.saveItems();
            this.storage.saveGiftCards();
        });
    }

    // Utility methods for debugging and advanced features
    exportData() {
        const data = this.storage.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `wishlist-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (this.storage.importData(data)) {
                    alert('Data imported successfully!');
                    this.ui.render();
                } else {
                    alert('Failed to import data. Please check the file format.');
                }
            } catch (error) {
                alert('Invalid file format. Please select a valid JSON backup file.');
            }
        };
        reader.readAsText(file);
    }

    getStats() {
        return this.storage.getStats();
    }

    clearAllData() {
        if (confirm('Are you sure you want to clear all wishlist data? This cannot be undone.')) {
            this.storage.clearAll();
            this.ui.render();
            console.log('All wishlist data cleared');
        }
    }
}

// Initialize the application
window.wishlistApp = new WishlistApp();

// Expose useful methods to the global scope for debugging
window.wishlistDebug = {
    exportData: () => window.wishlistApp.exportData(),
    getStats: () => window.wishlistApp.getStats(),
    clearAll: () => window.wishlistApp.clearAllData(),
    storage: () => window.wishlistStorage,
    ui: () => window.wishlistUI
};

// Console welcome message
console.log(`
🎯 Wishlist App Ready!

Available debug commands:
- wishlistDebug.exportData() - Export your data
- wishlistDebug.getStats() - View statistics
- wishlistDebug.clearAll() - Clear all data (with confirmation)

Keyboard shortcuts:
- Ctrl/Cmd + N: Add new item
- Escape: Close modal
- /: Focus search

Hover over items to see color and store info!
Click items to visit the store page!
`);
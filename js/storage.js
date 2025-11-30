class WishlistStorage {
    constructor() {
        this.storageKey = 'wishlist-data';
        this.giftCardsKey = 'gift-cards-data';
        this.categoriesKey = 'wishlist-categories';
        this.items = this.loadItems();
        this.giftCards = this.loadGiftCards();
        this.customCategories = this.loadCategories();
    }

    loadItems() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading items from storage:', error);
            return [];
        }
    }

    loadGiftCards() {
        try {
            const data = localStorage.getItem(this.giftCardsKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading gift cards from storage:', error);
            return [];
        }
    }

    loadCategories() {
        try {
            const data = localStorage.getItem(this.categoriesKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading categories from storage:', error);
            return [];
        }
    }

    saveItems() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.items));
        } catch (error) {
            console.error('Error saving items to storage:', error);
        }
    }

    saveGiftCards() {
        try {
            localStorage.setItem(this.giftCardsKey, JSON.stringify(this.giftCards));
        } catch (error) {
            console.error('Error saving gift cards to storage:', error);
        }
    }

    saveCategories() {
        try {
            localStorage.setItem(this.categoriesKey, JSON.stringify(this.customCategories));
        } catch (error) {
            console.error('Error saving categories to storage:', error);
        }
    }

    getAllItems() {
        return [...this.items];
    }

    getMostWantedItems() {
        return this.items.filter(item => item.mostWanted);
    }

    getItemById(id) {
        return this.items.find(item => item.id === id);
    }

    addItem(itemData) {
        const newItem = {
            id: this.generateId(),
            name: itemData.name || '',
            description: itemData.description || '',
            category: itemData.category || 'other',
            priority: itemData.priority || 'medium',
            mostWanted: itemData.mostWanted || (itemData.priority === 'high'), // Auto-set mostWanted for high priority
            favorite: itemData.favorite || false, // New favorite field
            variants: itemData.variants || [],
            image: itemData.image || '',
            dateAdded: new Date().toISOString(),
            purchased: false
        };

        // Ensure at least one variant exists
        if (newItem.variants.length === 0) {
            newItem.variants.push({
                color: '',
                size: '',
                price: '',
                link: '',
                storeName: ''
            });
        }

        this.items.push(newItem);
        this.saveItems();
        return newItem;
    }

    updateItem(id, updates) {
        const index = this.items.findIndex(item => item.id === id);
        if (index !== -1) {
            this.items[index] = { ...this.items[index], ...updates };

            // Auto-update mostWanted based on priority
            if (updates.priority) {
                if (updates.priority === 'high') {
                    this.items[index].mostWanted = true;
                } else if (updates.priority === 'medium' || updates.priority === 'low') {
                    // Automatically remove from mostWanted when priority is no longer high
                    this.items[index].mostWanted = false;
                }
            }

            this.saveItems();
            return this.items[index];
        }
        return null;
    }

    deleteItem(id) {
        const index = this.items.findIndex(item => item.id === id);
        if (index !== -1) {
            const deletedItem = this.items.splice(index, 1)[0];
            this.saveItems();
            return deletedItem;
        }
        return null;
    }

    toggleMostWanted(id) {
        const item = this.getItemById(id);
        if (item) {
            item.mostWanted = !item.mostWanted;
            this.saveItems();
            return item;
        }
        return null;
    }

    toggleFavorite(id) {
        const item = this.getItemById(id);
        if (item) {
            item.favorite = !item.favorite;
            this.saveItems();
            return item;
        }
        return null;
    }

    togglePurchased(id) {
        const item = this.getItemById(id);
        if (item) {
            item.purchased = !item.purchased;
            this.saveItems();
            return item;
        }
        return null;
    }

    searchItems(query) {
        const lowerQuery = query.toLowerCase();
        return this.items.filter(item =>
            item.name.toLowerCase().includes(lowerQuery) ||
            item.description.toLowerCase().includes(lowerQuery) ||
            item.category.toLowerCase().includes(lowerQuery)
        );
    }

    filterItems(filters) {
        let filteredItems = [...this.items];

        if (filters.category) {
            filteredItems = filteredItems.filter(item => item.category === filters.category);
        }

        if (filters.priority) {
            filteredItems = filteredItems.filter(item => item.priority === filters.priority);
        }

        if (filters.mostWanted !== undefined) {
            filteredItems = filteredItems.filter(item => item.mostWanted === filters.mostWanted);
        }

        if (filters.purchased !== undefined) {
            filteredItems = filteredItems.filter(item => item.purchased === filters.purchased);
        }

        return filteredItems;
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Export data for backup
    exportData() {
        return {
            version: '1.0',
            exportDate: new Date().toISOString(),
            items: this.items
        };
    }

    // Import data from backup
    importData(data) {
        try {
            if (data.items && Array.isArray(data.items)) {
                this.items = data.items;
                this.saveItems();
                return true;
            }
        } catch (error) {
            console.error('Error importing data:', error);
        }
        return false;
    }

    // Clear all data
    clearAll() {
        this.items = [];
        this.saveItems();
    }

    // Gift Cards methods
    getAllGiftCards() {
        return [...this.giftCards];
    }

    getGiftCardById(id) {
        return this.giftCards.find(card => card.id === id);
    }

    addGiftCard(cardData) {
        const newCard = {
            id: this.generateId(),
            name: cardData.name || '',
            image: cardData.image || '',
            link: cardData.link || '',
            notes: cardData.notes || '',
            priority: cardData.priority || 'medium',
            dateAdded: new Date().toISOString(),
            purchased: false
        };

        this.giftCards.push(newCard);
        this.saveGiftCards();
        return newCard;
    }

    updateGiftCard(id, updates) {
        const index = this.giftCards.findIndex(card => card.id === id);
        if (index !== -1) {
            this.giftCards[index] = { ...this.giftCards[index], ...updates };
            this.saveGiftCards();
            return this.giftCards[index];
        }
        return null;
    }

    deleteGiftCard(id) {
        const index = this.giftCards.findIndex(card => card.id === id);
        if (index !== -1) {
            const deletedCard = this.giftCards.splice(index, 1)[0];
            this.saveGiftCards();
            return deletedCard;
        }
        return null;
    }

    toggleGiftCardPurchased(id) {
        const card = this.getGiftCardById(id);
        if (card) {
            card.purchased = !card.purchased;
            this.saveGiftCards();
            return card;
        }
        return null;
    }

    searchGiftCards(query) {
        const lowerQuery = query.toLowerCase();
        return this.giftCards.filter(card =>
            card.name.toLowerCase().includes(lowerQuery) ||
            card.notes.toLowerCase().includes(lowerQuery)
        );
    }

    // Get statistics
    getStats() {
        const total = this.items.length;
        const mostWanted = this.items.filter(item => item.mostWanted).length;
        const purchased = this.items.filter(item => item.purchased).length;
        const categories = {};

        this.items.forEach(item => {
            categories[item.category] = (categories[item.category] || 0) + 1;
        });

        const giftCardTotal = this.giftCards.length;
        const giftCardsPurchased = this.giftCards.filter(card => card.purchased).length;

        return {
            total,
            mostWanted,
            purchased,
            unpurchased: total - purchased,
            categories,
            giftCards: {
                total: giftCardTotal,
                purchased: giftCardsPurchased,
                unpurchased: giftCardTotal - giftCardsPurchased
            }
        };
    }

    // Category management methods
    getDefaultCategories() {
        return ['electronics', 'clothing', 'school', 'sports', 'other'];
    }

    getAllCategories() {
        const defaultCategories = this.getDefaultCategories();
        const allCategories = [...defaultCategories, ...this.customCategories];
        return [...new Set(allCategories)]; // Remove duplicates
    }

    addCategory(categoryName) {
        const normalizedName = categoryName.toLowerCase().trim();

        // Check if category already exists (case-insensitive)
        const allCategories = this.getAllCategories();
        if (allCategories.some(cat => cat.toLowerCase() === normalizedName)) {
            return false; // Category already exists
        }

        // Add to custom categories
        this.customCategories.push(normalizedName);
        this.saveCategories();
        return true;
    }

    removeCategory(categoryName) {
        const index = this.customCategories.findIndex(cat => cat.toLowerCase() === categoryName.toLowerCase());
        if (index !== -1) {
            const removed = this.customCategories.splice(index, 1)[0];
            this.saveCategories();
            return removed;
        }
        return null;
    }

    isCategoryInUse(categoryName) {
        return this.items.some(item => item.category.toLowerCase() === categoryName.toLowerCase());
    }
}

// Create global storage instance
window.wishlistStorage = new WishlistStorage();
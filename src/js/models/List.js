import uniqid from 'uniqid';

export default class List {
    constructor (items) {
        this.items = [];
    }
    addItem (count, unit, ingredient) {
        const item = {
            id: uniqid(),
            count,
            unit,
            ingredient 
        }
        this.items.push(item);
        return item; // Good practice
    }

    deleteItem (id) {
        const index = this.items.findIndex(el => el.id === id);
        // [2, 4, 8] splice(1, 1) -> returns 4, original array mutated to [2, 8];
        // [2, 4, 8] slice(1, 1) -> returns 4, original array stays the same [2, 4, 8];
        this.items.splice(index, 1);
    }

    updateCount(id, newCount) {
        this.items.find(el => el.id === id).count = newCount;
    }
};
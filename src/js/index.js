// Global app controller
import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import {
    elements,
    renderLoader,
    clearLoader
} from './views/base';


/** Global App State 
 * - Search Object
 * - Current Recipe Object
 * - Shopping List Object
 * - Liked Recipes Object
 **/

const state = {};

/**
    Search Controller
**/

const searchControl = async () => {
    // 1) Get query from the view
    const query = searchView.getInput(); // Adds input from the submit button on the page

    if (query) {
        // 2) New search object and add to the state
        state.search = new Search(query);

        // 3) Prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);

        try {
            // 4) Search for recipes
            await state.search.getResults(); // get the search results after the promise was produced

            // 5) Render the results in the UI
            clearLoader();
            searchView.renderResults(state.search.result);
        } catch (err) {
            alert('Something went wrong with the search...');
            clearLoader();
        };

    };
};

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    searchControl();
});

elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10); // Convert it to number so it can be read. Add the then to show we are on a base from 0 to 9 (results of the array per page)
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }
});

/**
    Recipe Controller
**/

const controlRecipe = async () => {
    // Get ID from Url
    const id = window.location.hash.replace('#', ''); // Looks for the hash key and replaces it with nothing as we only need the value

    if (id) {
        // Prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        // Highlight selected search
        if (state.search) searchView.highlightSelected(id);

        // Create new recipe object
        state.recipe = new Recipe(id);

        try {
            // Get recipe data and parse ingredients
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();

            // Calculate servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();

            // Render the recipe
            clearLoader();
            recipeView.renderRecipe(state.recipe,
                state.likes.isLiked(id)
            );

        } catch (err) {
            alert('Error processing recipe!')
        }

    }
};

// window.addEventListener('hashchange', controlRecipe); // Look at the hash symbol and what the id says
// window.addEventListener('load', controlRecipe);

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe)); // Add the same event listener to multiple events.

/**
    List Controller
**/

const controlList = () => {
    // Create a new list IF there is none yet
    if(!state.list) state.list = new List();

    // Add each ingredient to the list and UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
        
    })
}

// Handling delete and update list item events
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    // Handle the delete button
    if (e.target.matches('.shopping__delete, .shopping__delete *')) {
        // Delete from state
        state.list.deleteItem(id);

        // Delete from UI
        listView.deleteItem(id);

    // Handle the count update
    } else if (e.target.matches('.shopping__count--value')) {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
});

/**
    Likes Controller
**/

state.likes = new Likes(); // Solution untill we include persistent data module
likesView.toggleLikeMenu(state.likes.getNumLikes());

const controlLike = () => {
    if (!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;

    // User has NOT liked current recipe
    if (!state.likes.isLiked(currentID)) {
        // Add like to the state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );

        // Toggle the like button
        likesView.toggleLikeBtn(true);

        // Add like to UI list
        likesView.renderLike(newLike);

    // User HAS liked current recipe
    } else {
        // Remove like from the state
        state.likes.deleteLike(currentID);

        // Toggle the like button
        likesView.toggleLikeBtn(false);

        // Remove like from UI list
        likesView.deleteLike(currentID);

    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
};

// Restore liked recipes on page load
window.addEventListener('load', () => {
    state.likes = new Likes();

    // Restore likes
    state.likes.readStorage();
    
    // Toggle like menu button
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    // Render the existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));

});

// Handling recipe button clicks
elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        // Decrease button is clicked
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
    } else if (e.target.matches('.btn-increase, .btn-increase *')) {
        // Increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        // Add ingredients to shopping list
        controlList();
    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        // Like controller
        controlLike();
    }
});

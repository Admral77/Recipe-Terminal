const output = document.getElementById('output');
const commandInput = document.getElementById('command-input');

const apiKey = 'YOUR_SPOONACULAR_API_KEY';  // Replace with your Spoonacular API key
const apiUrl = 'https://api.spoonacular.com/recipes';

let commandHistory = [];
let historyIndex = -1;

// Welcome message
const welcomeMessage = `
    <div class="welcome">
        <h1>Welcome to the Recipe Finder Terminal</h1>
        <p>Type <strong>help</strong> to see available commands.</p>
    </div>
`;

output.innerHTML += welcomeMessage;

const commands = {
    'help': `
        <div>Available commands:</div>
        <div>- search [ingredient]: Search for recipes with a specific ingredient</div>
        <div>- random: Get a random recipe</div>
        <div>- clear: Clear the terminal screen</div>
        <div>- set favorites: Start entering your favorite ingredients for recommendations</div>
    `,
    'clear': 'clear',
};

const fetchRecipes = async (query) => {
    const response = await fetch(`${apiUrl}/complexSearch?apiKey=${apiKey}&query=${query}`);
    const data = await response.json();
    return data.results;
};

const fetchRandomRecipe = async () => {
    const response = await fetch(`${apiUrl}/random?apiKey=${apiKey}`);
    const data = await response.json();
    return data.recipes[0];
};

const fetchRecipesByFavorites = async (favorites) => {
    const responses = await Promise.all(favorites.map(ingredient => fetchRecipes(ingredient)));
    let allRecipes = [];
    responses.forEach(response => allRecipes = allRecipes.concat(response));
    
    // Remove duplicates and sort by popularity (assuming 'popularity' is available)
    const uniqueRecipes = Array.from(new Set(allRecipes.map(a => a.id)))
        .map(id => allRecipes.find(a => a.id === id))
        .sort((a, b) => b.popularity - a.popularity);

    return uniqueRecipes.slice(0, 5); // Top 5 recommendations
};

let favoriteIngredients = [];
let isCollectingFavorites = false;

const askForFavorites = () => {
    output.innerHTML += `
        <div>Please type your favorite ingredients one by one. Type <strong>done</strong> when finished.</div>
    `;
    isCollectingFavorites = true;
};

const handleUserInput = async (input) => {
    let response;

    if (isCollectingFavorites) {
        if (input === 'done') {
            if (favoriteIngredients.length < 1) {
                response = `<div class="error">Please add at least one favorite ingredient before finishing.</div>`;
            } else {
                isCollectingFavorites = false;
                response = `<div>Your favorite ingredients are collected. Type <strong>random</strong> to get a recipe based on your ingredients or add more ingredients.</div>`;
                favoriteIngredients = []; // Clear favorites after processing
                askForFavorites(); // Re-initialize asking for favorites
            }
        } else {
            favoriteIngredients.push(input);
            response = `<div>Added "${input}" to your favorite ingredients (${favoriteIngredients.length}).</div>`;
        }
    } else if (input.startsWith('search ')) {
        const ingredient = input.substring(7).trim();
        if (ingredient) {
            const recipes = await fetchRecipes(ingredient);
            if (recipes.length > 0) {
                response = '<div>Recipes found:</div>';
                recipes.forEach(recipe => {
                    response += `
                        <div class="recipe-title">${recipe.title}</div>
                        <div class="recipe-description">Instructions: ${recipe.instructions || 'No instructions available.'}</div>
                    `;
                });
            } else {
                response = `<div class="error">No recipes found for ingredient: ${ingredient}</div>`;
            }
        } else {
            response = `<div class="error">Please provide an ingredient to search.</div>`;
        }
    } else if (input === 'random') {
        const recipe = await fetchRandomRecipe();
        response = `
            <div class="recipe-title">${recipe.title}</div>
            <div class="recipe-description">Instructions: ${recipe.instructions || 'No instructions available.'}</div>
        `;
    } else if (input === 'set favorites') {
        favoriteIngredients = [];
        askForFavorites();
        return;
    } else if (input === 'recommend') {
        if (favoriteIngredients.length < 1) {
            response = `<div>Please add at least one favorite ingredient before getting recommendations.</div>`;
        } else {
            const recommendedRecipes = await fetchRecipesByFavorites(favoriteIngredients);
            response = '<div>Recommended recipes based on your favorite ingredients:</div>';
            recommendedRecipes.forEach(recipe => {
                response += `
                    <div class="recipe-title">${recipe.title}</div>
                    <div class="recipe-description">Instructions: ${recipe.instructions || 'No instructions available.'}</div>
                `;
            });
            // Reinitialize asking for favorites
            askForFavorites();
        }
    } else if (input === 'clear') {
        output.innerHTML = '';
        return;
    } else {
        response = commands[input] || `<div class="error">Command not found: ${input}</div>`;
    }

    output.innerHTML += `<div><span class="prompt">user@terminal:~$</span> ${input}</div>`;
    output.innerHTML += `<div>${response}</div>`;

    commandHistory.push(input);
    historyIndex = -1;

    commandInput.value = '';
    window.scrollTo(0, document.body.scrollHeight);
};

commandInput.addEventListener('keydown', async function(event) {
    if (event.key === 'Enter') {
        const input = commandInput.value.trim().toLowerCase();
        await handleUserInput(input);
    }

    // Handle arrow keys for command history navigation
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        if (event.key === 'ArrowUp') {
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
            }
        } else if (event.key === 'ArrowDown') {
            if (historyIndex > 0) {
                historyIndex--;
            } else {
                historyIndex = -1;
            }
        }

        if (historyIndex !== -1) {
            commandInput.value = commandHistory[commandHistory.length - 1 - historyIndex];
        } else {
            commandInput.value = '';
        }
    }
});

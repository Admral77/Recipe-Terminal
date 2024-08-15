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
    `,
    'clear': 'clear',
};

const fetchRecipes = async (query) => {
    try {
        const response = await fetch(`${apiUrl}/complexSearch?apiKey=${apiKey}&query=${query}&number=5`);
        const data = await response.json();
        console.log("Fetch Recipes Response:", data);  // Debugging output
        return data.results || [];
    } catch (error) {
        console.error("Error fetching recipes:", error);  // Debugging output
        return [];
    }
};

const fetchRandomRecipe = async () => {
    try {
        const response = await fetch(`${apiUrl}/random?apiKey=${apiKey}`);
        const data = await response.json();
        console.log("Fetch Random Recipe Response:", data);  // Debugging output
        return data.recipes ? data.recipes[0] : null;
    } catch (error) {
        console.error("Error fetching random recipe:", error);  // Debugging output
        return null;
    }
};

const handleUserInput = async (input) => {
    let response;

    if (input.startsWith('search ')) {
        const ingredient = input.substring(7).trim();
        if (ingredient) {
            const recipes = await fetchRecipes(ingredient);
            if (recipes.length > 0) {
                response = '<div>Recipes found:</div>';
                recipes.forEach(recipe => {
                    response += `
                        <div class="recipe-title">${recipe.title}</div>
                        <div class="recipe-description">${recipe.instructions || 'No instructions available.'}</div>
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
        if (recipe) {
            response = `
                <div class="recipe-title">${recipe.title}</div>
                <div class="recipe-description">${recipe.instructions || 'No instructions available.'}</div>
            `;
        } else {
            response = `<div class="error">Unable to fetch a random recipe.</div>`;
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
        event.preventDefault(); // Prevent default form submission behavior
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

// Supabase Configuration
const SUPABASE_URL = 'https://rvehrbiucrilpuvvkjbs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2ZWhyYml1Y3JpbHB1dnZramJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyNzk5NTAsImV4cCI6MjA1Mzg1NTk1MH0.YKMde10eNdODGFjTSkhEFQD95LH7ChGcIVd_25g4odE';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// State Management
let boardState = {
    columns: [],
    isLoading: true
};

// DOM Elements
const elements = {
    board: document.getElementById('board'),
    status: document.getElementById('status'),
    loading: document.getElementById('loading')
};

// Initialize Application
(async () => {
    showLoading();
    try {
        await initializeBoard();
        setupEventListeners();
    } catch (error) {
        showError('Failed to initialize board');
    } finally {
        hideLoading();
    }
})();

async function initializeBoard() {
    const { data, error } = await supabase
        .from('kanban')
        .select('columns')
        .eq('id', 1)
        .single();

    if (error || !data) {
        await createInitialBoard();
    } else {
        boardState.columns = data.columns;
    }
    renderBoard();
}

async function createInitialBoard() {
    const initialColumns = [
        { title: "Not Started", cards: [] },
        { title: "In Progress", cards: [] },
        { title: "Parked", cards: [] },
        { title: "Done", cards: [] }
    ];

    const { error } = await supabase
        .from('kanban')
        .upsert({ id: 1, columns: initialColumns });

    if (error) throw error;
    boardState.columns = initialColumns;
}

function renderBoard() {
    elements.board.innerHTML = boardState.columns.map((col, colIndex) => `
        <div class="column p-4 rounded-xl shadow-lg">
            <h3 class="text-lg font-semibold mb-4 text-gray-700">${col.title}</h3>
            ${col.cards.map((card, cardIndex) => `
                <div class="card mb-3 p-4 bg-white rounded-lg border border-gray-200"
                    draggable="true"
                    data-col="${colIndex}"
                    data-card="${cardIndex}"
                    ondragstart="handleDragStart(event)"
                    ondragover="handleDragOver(event)"
                    ondrop="handleDrop(event)">
                    <div class="flex justify-between items-center">
                        <span>${card}</span>
                        <button onclick="deleteCard(${colIndex}, ${cardIndex})" 
                            class="text-red-400 hover:text-red-600 transition-colors">
                            ✕
                        </button>
                    </div>
                </div>
            `).join('')}
            <button onclick="addCard(${colIndex})" 
                class="w-full mt-2 p-2 text-gray-500 hover:text-gray-700 rounded-lg transition-colors">
                + Add Card
            </button>
        </div>
    `).join('');
}

// Event Handlers
function handleDragStart(e) {
    const colIndex = parseInt(e.target.dataset.col);
    const cardIndex = parseInt(e.target.dataset.card);
    e.dataTransfer.setData('text/plain', JSON.stringify({ colIndex, cardIndex }));
    e.target.classList.add('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
}

async function handleDrop(e) {
    e.preventDefault();
    const source = JSON.parse(e.dataTransfer.getData('text/plain'));
    const targetCol = parseInt(e.target.closest('.column').dataset.col);
    
    const movedCard = boardState.columns[source.colIndex].cards.splice(source.cardIndex, 1)[0];
    boardState.columns[targetCol].cards.push(movedCard);
    
    await saveBoardState();
    renderBoard();
}

async function addCard(colIndex) {
    const content = prompt('Enter card content:');
    if (content) {
        boardState.columns[colIndex].cards.push(content);
        await saveBoardState();
        renderBoard();
    }
}

async function deleteCard(colIndex, cardIndex) {
    if (confirm('Delete this card?')) {
        boardState.columns[colIndex].cards.splice(cardIndex, 1);
        await saveBoardState();
        renderBoard();
    }
}

async function saveBoardState() {
    const { error } = await supabase
        .from('kanban')
        .upsert({ id: 1, columns: boardState.columns });
    
    if (error) {
        showError('Failed to save changes');
        throw error;
    }
    updateStatus('Changes saved successfully');
}

// UI Helpers
function showLoading() {
    elements.loading.classList.remove('hidden');
}

function hideLoading() {
    elements.loading.classList.add('hidden');
}

function updateStatus(message) {
    elements.status.textContent = message;
    setTimeout(() => elements.status.textContent = '', 3000);
}

function showError(message) {
    elements.status.textContent = `Error: ${message}`;
    elements.status.classList.add('text-red-500');
    setTimeout(() => {
        elements.status.textContent = '';
        elements.status.classList.remove('text-red-500');
    }, 5000);
}
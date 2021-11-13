/*********
 * DOMs
 *********/
let dom_request_posts_button = document.querySelector('#request-posts');
let dom_posts_container = document.querySelector('#posts-container');
let dom_sort_group_form = document.querySelector('#sort-group-form');
let dom_group_by_id_checkbox = dom_sort_group_form.querySelector('input[name="groupUserId"]');
let dom_select_sort_by_title = dom_sort_group_form.querySelector('select');

/*********
 * Settings
 *********/
 const POST_TEMPLATE = document.querySelector('#post-card').innerHTML;

let context = {
    'posts': null
}

let state = {
    'sortByTitle': 'asc',
    'groupByUserId': false
}

/****************
 * Loaders 
 *****************/
async function loadPosts() {
    try {
        const  response = await fetch('https://jsonplaceholder.typicode.com/posts');
        const json = await response.json();
        context['posts'] = json;
        // Save Post to localStorage
        localStorage.setItem('posts', JSON.stringify(context['posts']));
    } catch(err) {
        alert(err);
    }
}


function loadLocalStorage() {

    // Load Posts
    context['posts'] = JSON.parse(localStorage.getItem('posts'));

    // Load State
    let last_state = JSON.parse(localStorage.getItem('sort-group-state'));
    if (last_state) {
        state['sortByTitle'] = last_state['sortByTitle'];
        state['groupByUserId'] = last_state['groupByUserId'];
    }

    return Promise.resolve()
}

/*********
 * Views 
 *********/
function populatePosts() {
    // Sort Group form
    dom_select_sort_by_title.value = state['sortByTitle'];
    dom_group_by_id_checkbox.checked = state['groupByUserId'];

    let posts_html = '';
    let user_id;
    context['posts'].forEach((post) => {
        if (state['groupByUserId'] && user_id !== post['userId']) {
            user_id = post['userId'];
            posts_html += '<p class="user-id">User Id: ' + user_id; 
        }
        posts_html += POST_TEMPLATE.replace(/\${(.*?)}/g, (x, g) => post[g]);
    });

    dom_posts_container.innerHTML = posts_html;

    // Hide Request button
    dom_request_posts_button.classList.remove('is-shown');
}

/*********
 * Helpers
 *********/
function arrangePosts() {

    if (!context['posts'] || Object.keys(context['posts']).length === 0 ) {
        return;
    }

    if (state['sortByTitle'] === 'asc') { 
        context['posts'].sort((a,b) => a.title.localeCompare(b.title));
    }
    else {
        context['posts'].sort((a,b) => b.title.localeCompare(a.title));
    }

    if (state['groupByUserId']) {
        context['posts'].sort((a,b) => Number(a.userId) - Number(b.userId));
    }

    // Save State to localStorage
    localStorage.setItem('sort-group-state', JSON.stringify(state));
    return populatePosts();
}

/*********
 * Listeners 
 *********/
async function onRequestPostsButtonClick(e) {
    e.preventDefault();
    
    await loadPosts();
    return arrangePosts();
}

function onSortGroupFormChange() {
    // Update State
    state['sortByTitle'] = dom_select_sort_by_title.value;
    state['groupByUserId'] = dom_group_by_id_checkbox.checked;

    return arrangePosts();
}

/*********
 * Init 
 *********/
async function init() {
    // Bind Listeners
    dom_request_posts_button.onclick = onRequestPostsButtonClick;
    dom_sort_group_form.onchange = onSortGroupFormChange;

    await loadLocalStorage()
    return arrangePosts();
}

init();

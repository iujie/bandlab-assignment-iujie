/*********
 * DOMs
 *********/
let dom_audio_list_container = document.querySelector('#audio-list-container');
let dom_audios; // Dynamic


/*********
 * Settings
 *********/
const AUDIO_TEMPLATE = document.querySelector('#audio-list-template').innerHTML;
const audio_context = new AudioContext();
let audio_source;

let context = {
    'audios': null
}

let state = {
    'currentAudioId': null,
    'playPauseStatus': false
}


/**********
 * Loaders 
 ***********/
async function loadAudioSamples() {
    try {
        const response = await fetch('../json/sample-audios.json');
        const json = await response.json();
        context['audios'] = json;
    } catch(err) {
        alert(err);
    }
}

async function loadAudio(src) {
    try {
        const response = await fetch(src);
        const arrayBuffer = await response.arrayBuffer();
        const arrayBuffer_decode = await audio_context.decodeAudioData(arrayBuffer);
        return arrayBuffer_decode;
    } catch(err) {
        alert(err);
    }
}

/*********
 * Views 
 *********/
function populateAudioList() {
    if (!context['audios']) {
        return;
    }
    let audio_list_html = '';
    context['audios'].forEach((audio) => {
        audio_list_html += AUDIO_TEMPLATE.replace(/\${(.*?)}/g, (x, g) => audio[g]);
    });

    dom_audio_list_container.innerHTML = audio_list_html;

    // Bind audio buttons with listeners
    dom_audios = dom_audio_list_container.querySelectorAll('button');
    dom_audios.forEach(function(t_audio) {
        t_audio.onclick = onAudioClick;
    })
}

/************
 * Helpers 
 ************/
function playAudio(audioBuffer) {
    audio_source = audio_context.createBufferSource();
    audio_context.resume();

    audio_source.buffer = audioBuffer;
    audio_source.connect(audio_context.destination);
    audio_source.start();
    return updateAudiouttons();
}

function updateAudiouttons() {
    // Reset audio buttons appearance to 'play'
    dom_audios.forEach((t) => t.classList.remove('audio-pause'))

    if (state['playPauseStatus'] || !state['currentAudioId']) {
        return;
    }
    
    // Update selected audio button appearance to 'pause'
    let data_id = 'div[data-id="' + state['currentAudioId'] + '"]';
    let target_audio = dom_audio_list_container.querySelector(data_id);
    let target_button = target_audio.querySelector('.audio-play-pause');
    target_button.classList.add('audio-pause');
}

/************
 * Listeners 
 ************/
async function onAudioClick(e) {
    e.preventDefault();

    let audio_button = e.currentTarget;
    let audio_type = audio_button.className;
    let target_audio_id = audio_button.parentElement.getAttribute('data-id');
    let src = audio_button.parentElement.getAttribute('data-audio');

    // Reset Status
    state['playPauseStatus'] = false;

    // Audio Disconnect if stop button clicked
    if (audio_type === 'audio-stop') {
        if (state['currentAudioId'] === target_audio_id) {
            audio_source.disconnect(0);
            state['currentAudioId'] = null;
            return updateAudiouttons();
        }
        return;
    }

    // Play Audio if no running audio
    if (!state['currentAudioId']) {
        state['currentAudioId'] = target_audio_id;
        const response = await loadAudio(src);
        return  playAudio(response);
    }

    // Suspend/Resume for running audio
    if (state['currentAudioId'] && state['currentAudioId'] === target_audio_id) {
        if (audio_context.state === 'running') {
            state['playPauseStatus'] = true;
            audio_context.suspend();
            return updateAudiouttons();
        }
        else if (audio_context.state === 'suspended') {
            audio_context.resume();
            return updateAudiouttons();
        }
    }

    // Disconnect running audio then reload new audio
    state['currentAudioId'] = target_audio_id;
    audio_source.disconnect(0);
    const response_1 = await loadAudio(src);
    return playAudio(response_1);
}
async function init() {
    await loadAudioSamples()
    return populateAudioList();
}

init();

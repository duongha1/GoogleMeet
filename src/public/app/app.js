const socket = io('/');
const peer = new Peer(undefined, {
    host:'/',
    port: '3001'
});

const peers = {};
const videoLocal = document.getElementById('localVideo');
const videoGrid = document.getElementById('video-grid');
const myVideo = document.createElement('video');

//Tell to server
peer.on('open', id=>{
    console.log("peerid: ", id);
    socket.emit('JOIN_ROOM', ROOM_ID, id);
    peerId = id;
});

//Open stream
function openStream(){
    const contraints = {audio: false, video: true};
    return navigator.mediaDevices.getUserMedia(contraints);
}
function playRemoteStream(video, stream) {
    video.srcObject = stream;
    video.play();
    videoGrid.append(video);
}
function playLocalStream(video, stream) {
    video.srcObject = stream;
    video.play();
    videoLocal.append(video);
    videoLocal.children[0].nextElementSibling.setAttribute('id','localStream');
}
function connecToNewUser(userId, stream){
    const call = peer.call(userId, stream);

    const videoCaller = document.createElement('video');
    call.on('stream', userVideoStream => playRemoteStream(videoCaller,userVideoStream));
    call.on('close', ()=>{
        videoCaller.remove();
    })
    peers[userId] = call;
}

openStream()
    .then(stream => {
        playLocalStream(myVideo, stream);
 
        //Listen Server
        socket.on('USER_CONNECTED', userId => {
            console.log("user: ", userId);
            //make a call to other user
            connecToNewUser(userId, stream);
        });

        //answer call from people
        peer.on('call', call=>{
            // Answer the call, providing our mediaStream
            call.answer(stream);
            
            const videoCaller = document.createElement('video');
            call.on('stream', userVideoStream => playRemoteStream(videoCaller,userVideoStream));
        });
    });


//Disconnect
socket.on('USER_DISCONNECT', userId=>{
    if(peers[userId]) peers[userId].close();
});
$('#stopCall').click(()=>{
    $('#localCamContainer').attr('action','stop-call');
});

// ----------------CHAT-----------------
const inputTxt = document.getElementById("inputTxt");
const btnSend = document.getElementById("sendTxt")
inputTxt.addEventListener("keyup", function(event) {
    if (event.keyCode === 13 && inputTxt.value != "") {
            event.preventDefault();
            socket.emit('SEND_TEXT', peerId, inputTxt.value);
            inputTxt.value = "";
    }
});

function sendAction(){
    if(inputTxt.value != ""){
        socket.emit('SEND_TEXT', peerId, inputTxt.value);
        inputTxt.value = "";
    }
}

socket.on('SHOW_TEXT', (id, text) => {
    const txt = '<p style="font-weight: bold; margin-bottom: 0rem;">' + id +'</p>'+'<p>' + text +'</p>';
    $('#messTxt').append(txt);
});

//Option chat and video
const chat = document.getElementById('chat');
const option1 = document.getElementById('option1');
const option2 = document.getElementById('option2');
option1.onclick = function(){
    chat.style.display = "block";
    videoGrid.style.display = "none";
}
option2.onclick = function(){
    chat.style.display = "none";
    videoGrid.style.display = "block";
}


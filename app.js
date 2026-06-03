/* =========================
SUPABASE CONFIG
========================= */

const supabaseUrl =
"https://sgcmrhbltlhifkqnotuh.supabase.co"

const supabaseKey =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21yaGJsdGxoaWZrcW5vdHVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3Nzk0MjcsImV4cCI6MjA5NTM1NTQyN30.UB2dL80N6qBRHwoJ8QlNfSJeQxPJsovOzyQxqBx5gMg"

const supabaseClient =
window.supabase.createClient(
supabaseUrl,
supabaseKey
)

/* =========================
TELEGRAM CONFIG
========================= */

const botToken =
"8610361558:AAEvRr5cEFn_1lkdEskzKyAFuwLDCWXV9sY"

const chatId =
"8367791715"

/* =========================
GLOBAL
========================= */

let oldChatHTML = ""

/* =========================
SIGNUP
========================= */

async function signup(){

const name =
document.getElementById(
"name"
)?.value

const username =
document.getElementById(
"username"
)?.value

const email =
document.getElementById(
"signupEmail"
)?.value

const password =
document.getElementById(
"signupPassword"
)?.value

if(
!name ||
!username ||
!email ||
!password
){

alert(
"Fill all fields"
)

return

}

const {

error

} =
await supabaseClient
.auth
.signUp({

email,
password

})

if(error){

alert(
error.message
)

return

}

/* SAVE USER */

await supabaseClient
.from("users")
.insert([{

name:name,

username:username,

email:email,

online:false,

typing:false,

banned:false,

last_seen:""

}])

alert(
"Signup Success 🚀"
)

window.location.href =
"login.html"

}

/* =========================
LOGIN
========================= */
async function resetPassword(){

const email =
prompt(
"Enter Your Email"
)

if(!email){
return
}

const { error } =
await supabaseClient.auth
.resetPasswordForEmail(
email,
{
redirectTo:
"https://vivekprajapati.in/reset-password.html"
}
)

if(error){

alert(
error.message
)

return

}

alert(
"Password Reset Email Sent 📧"
)

}
async function login(){

/* MAINTENANCE CHECK */

const {

data:setting

} =
await supabaseClient
.from("settings")
.select("*")
.eq(
"id",
1
)
.single()

if(
setting?.maintenance
){

alert(
"Site Under Maintenance 🛠️"
)

return

}

const email =
document.getElementById(
"email"
)?.value

const password =
document.getElementById(
"password"
)?.value

/* CHECK BAN */

const {

data:userData

} =
await supabaseClient
.from("users")
.select("*")
.eq(
"email",
email
)
.single()

if(
userData &&
userData.banned
){

alert(
"You Are Banned 🚫"
)

return

}

/* LOGIN */

const {

error

} =
await supabaseClient
.auth
.signInWithPassword({

email,
password

})

if(error){

alert(
error.message
)

return

}

/* ONLINE */

await supabaseClient
.from("users")
.update({

online:true

})
.eq(
"email",
email
)

window.location.href = "home.html"

}

/* =========================
SEND TELEGRAM
========================= */

async function sendTelegramMessage(
message,
user
){

const text =

`🔥 New Message

👤 User:
${user}

💬 Message:
${message}`

try{

await fetch(

`https://api.telegram.org/bot${botToken}/sendMessage`,

{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

chat_id:chatId,

text:text

})

})

}catch(err){

console.log(err)

}

}

/* =========================
SEND MESSAGE
========================= */

async function sendMessage(){

const input =
document.getElementById(
"messageInput"
)

const message =
input?.value || ""

if(
message.trim()==""
){

return

}

const {

data:{user}

} =
await supabaseClient
.auth
.getUser()

if(!user){

return

}

const currentTime =
new Date()
.toLocaleTimeString()

const {

error

} =
await supabaseClient
.from("messages")
.insert([{

user_email:user.email,

message:message,

type:"user",

time:currentTime,

seen:false

}])

if(error){

alert(
error.message
)

return

}

/* TELEGRAM */

await sendTelegramMessage(

message,
user.email

)

input.value=""

/* STOP TYPING */

await supabaseClient
.from("users")
.update({

typing:false

})
.eq(
"email",
user.email
)

loadMessages()

}

/* =========================
DELETE MESSAGE
========================= */

async function deleteMessage(id){

await supabaseClient
.from("messages")
.delete()
.eq(
"id",
id
)

loadMessages()

}

/* =========================
LOAD CHAT
========================= */

async function loadMessages(){

const messagesDiv =
document.getElementById(
"messages"
)

if(!messagesDiv){

return

}

const {

data:{user}

} =
await supabaseClient
.auth
.getUser()

if(!user){

return

}

const {

data:messages

} =
await supabaseClient
.from("messages")
.select("*")
.eq(
"user_email",
user.email
)
.order(
"id",
{
ascending:true
}
)

if(!messages){

return

}

let newHTML = ""

/* LOOP */

for(
const msg
of messages
){

/* SEEN */

if(
msg.type=="admin" &&
!msg.seen
){

await supabaseClient
.from("messages")
.update({

seen:true

})
.eq(
"id",
msg.id
)

}

/* USER */

if(
msg.type=="user"
){

newHTML += `

<div class="
message
user-message
">

<b>
You 😎
</b>

<br><br>

${msg.message}

<div class="
msg-bottom
">

<span>

⏰
${msg.time || ""}

</span>

<span>

${msg.seen
? "✔✔ Seen"
: "✔ Sent"}

</span>

</div>

<br>

<button
class="
delete-btn
"

onclick="
deleteMessage(
${msg.id}
)
">

Delete

</button>

</div>

`

}

/* ADMIN */

else{

newHTML += `

<div class="
message
admin-message
">

<b>
Admin 👑
</b>

<br><br>

${msg.message}

<div class="
msg-bottom
">

<span>

⏰
${msg.time || ""}

</span>

<span>

👀 Seen

</span>

</div>

</div>

`

}

}

/* UPDATE ONLY IF CHANGED */

if(
oldChatHTML !==
newHTML
){

messagesDiv.innerHTML =
newHTML

oldChatHTML =
newHTML

messagesDiv.scrollTop =
messagesDiv.scrollHeight

/* SOUND */

const sound =
document.getElementById(
"notifSound"
)

if(sound){

sound.play()
.catch(()=>{})

}

}

}

/* =========================
LOGOUT
========================= */

async function logout(){

const {

data:{user}

} =
await supabaseClient
.auth
.getUser()

if(user){

await supabaseClient
.from("users")
.update({

online:false,

typing:false,

last_seen:
new Date()
.toLocaleString()

})
.eq(
"email",
user.email
)

}

await supabaseClient
.auth
.signOut()

window.location.href =
"login.html"

}

/* =========================
TYPING
========================= */

const messageInput =
document.getElementById(
"messageInput"
)

if(messageInput){

messageInput
.addEventListener(

"input",

async ()=>{

const {

data:{user}

} =
await supabaseClient
.auth
.getUser()

if(!user){

return

}

await supabaseClient
.from("users")
.update({

typing:true

})
.eq(
"email",
user.email
)

setTimeout(

async ()=>{

await supabaseClient
.from("users")
.update({

typing:false

})
.eq(
"email",
user.email
)

},

1500

)

}

)

}

/* =========================
AUTO LOAD
========================= */

setInterval(()=>{

loadMessages()

},1500)

/* =========================
START
========================= */

loadMessages()
async function searchUser(){

const username =
document
.getElementById(
"searchUsername"
)
.value
.trim()

if(!username){

return

}

const {

data

} =
await supabaseClient
.from("users")
.select("*")
.eq(
"username",
username
)
.single()

if(!data){

document
.getElementById(
"searchResult"
)
.innerHTML =
"User Not Found ❌"

return

}

document
.getElementById(
"searchResult"
)
.innerHTML =

`

<div
style="
padding:10px;
margin-top:10px;
background:#111;
border-radius:10px;
"
>

${data.name}
(@${data.username})

<br><br>

<button
onclick="
openChat(
'${data.email}',
'${data.username}'
)
">
Chat
</button>

</div>

`

}
async function sendFriendRequest(
receiverEmail
){

const {

data:{user}

} =
await supabaseClient
.auth
.getUser()

if(!user){

return

}

await supabaseClient
.from(
"friend_requests"
)
.insert([{

sender_email:
user.email,

receiver_email:
receiverEmail,

time:
new Date()
.toLocaleString()

}])

alert(
"Friend Request Sent 🚀"
)

}
async function loadRequests(){

const {
data:{user}
}
=
await supabaseClient.auth.getUser()

if(!user)return

const {data}
=
await supabaseClient
.from("friend_requests")
.select("*")
.eq("receiver_email",user.email)

let html=""

data?.forEach(req=>{

html += `
<div style="padding:10px;background:#111;margin:10px 0;border-radius:10px;">
📩 ${req.sender_email}
<br><br>
<button onclick="acceptRequest(${req.id})">Accept</button>
</div>
`

})

const box =
document.getElementById("requestsBox")

if(box){
box.innerHTML = html
}

}

async function acceptRequest(id){

alert("Accept button working 😎")

}
if(document.getElementById("requestsBox")){

setInterval(()=>{

loadRequests()

},2000)

loadRequests()

}
function openChat(
email,
username
){

localStorage.setItem(
"chatEmail",
email
)

localStorage.setItem(
"chatUsername",
username
)

window.location.href =
"private-chat.html"

}

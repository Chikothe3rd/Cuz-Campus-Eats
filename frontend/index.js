const modal = document.getElementById('modal');
const topSignup = document.getElementById('top-signup');
const topLogin = document.getElementById('top-login');
const heroSignup = document.getElementById('hero-signup');
const heroLogin = document.getElementById('hero-login');
const closeModal = document.getElementById('close-modal');
const switchToSignup = document.getElementById('switch-to-signup');
const modalTitle = document.getElementById('modal-title');

function openModal(mode='login'){
  modal.style.display='flex';
  if(mode==='signup'){
    modalTitle.textContent='Create account';
    switchToSignup.textContent='Switch to Log In';
  } else {
    modalTitle.textContent='Log in';
    switchToSignup.textContent='Switch to Sign Up';
  }
}
function closeModalFn(){ modal.style.display='none'; }

topSignup.addEventListener('click', ()=>openModal('signup'));
heroSignup.addEventListener('click', ()=>openModal('signup'));
topLogin.addEventListener('click', ()=>openModal('login'));
heroLogin.addEventListener('click', ()=>openModal('login'));
closeModal.addEventListener('click', closeModalFn);
modal.addEventListener('click', (e)=>{ if(e.target===modal) closeModalFn(); });

// swap behaviour
switchToSignup.addEventListener('click', ()=>{
  if(modalTitle.textContent.includes('Create')){
    // currently signup -> switch to login
    openModal('login');
  } else {
    openModal('signup');
  }
});

// mock submit
document.getElementById('modal-form').addEventListener('submit', (e)=>{
  e.preventDefault();
  alert(modalTitle.textContent + ' (demo)');
  closeModalFn();
});
// --- IGNORE ---
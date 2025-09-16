const btn = document.getElementById('test-button');
if (btn) {
  btn.addEventListener('click', function(){
    const links = document.querySelectorAll('.titles a');
    console.log('links:', links);
  });
}

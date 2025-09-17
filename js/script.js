const titleClickHandler = function(event){
  event.preventDefault();
  console.log('Link was clicked!');

  // Inspect the event object and key fields
  console.log('Event object:', event);
  console.log('event.target:', event.target);             // deepest clicked element (likely <span>)
  console.log('event.currentTarget:', event.currentTarget); // element with the listener (<a>)

  /* remove class 'active' from all article links  */
  const activeLinks = document.querySelectorAll('.titles a.active');
  for (let a of activeLinks) {
    a.classList.remove('active');
  }

  /* add class 'active' to the clicked link */
  event.currentTarget.classList.add('active');

  /* remove class 'active' from all articles */
  const activeArticles = document.querySelectorAll('article.active');
  for (let article of activeArticles) {
    article.classList.remove('active');
  }

  /* get 'href' attribute from the clicked link */
  const href = event.currentTarget.getAttribute('href');

  /* find the correct article using the selector (value of 'href' attribute) */
  const targetArticle = document.querySelector(href);

  /* add class 'active' to the correct article */
  if (targetArticle) {
    targetArticle.classList.add('active');
  } else {
    console.warn('No article found for selector:', href);
  }
};

const links = document.querySelectorAll('.titles a');
for (let link of links){
  link.addEventListener('click', titleClickHandler);
}

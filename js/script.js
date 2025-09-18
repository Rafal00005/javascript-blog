const optArticleSelector = '.post',
  optTitleSelector = '.post-title',
  optTitleListSelector = '.titles';

function generateTitleLinks() {

  /* remove contents of titleList */
  const titleList = document.querySelector(optTitleListSelector);
  titleList.innerHTML = '';

  /* find all the articles and save them to variable: articles */
  const articles = document.querySelectorAll(optArticleSelector);

  /* accumulator for all links (must be let and outside the loop) */
  let html = '';

  for (let article of articles) {
    /* get the article id */
    const articleId = article.getAttribute('id');

    /* get the title from the title element (inside current article) */
    const articleTitle = article.querySelector(optTitleSelector).innerHTML;

    /* create HTML of the link */
    const linkHTML = '<li><a href="#' + articleId + '"><span>' + articleTitle + '</span></a></li>';

    /* insert link into html variable */
    html = html + linkHTML;

    /* debug: see how html grows every loop turn */
    console.log('html so far:', html);
  }

  /* insert all links into titleList at once */
  titleList.innerHTML = html;

  /* add click listeners to the newly created links */
  const links = titleList.querySelectorAll('a');
  for (let link of links) {
    link.addEventListener('click', titleClickHandler);
  }
}

const titleClickHandler = function (event) {
  event.preventDefault();
  const clickedElement = this;
  console.log('Link was clicked!');

  /* remove class 'active' from all article links */
  const activeLinks = document.querySelectorAll('.titles a.active');
  for (let activeLink of activeLinks) {
    activeLink.classList.remove('active');
  }

  /* add class 'active' to the clicked link */
  clickedElement.classList.add('active');

  /* remove class 'active' from all articles */
  const activeArticles = document.querySelectorAll('.post.active'); // or 'article.active'
  for (let activeArticle of activeArticles) {
    activeArticle.classList.remove('active');
  }

  /* get 'href' attribute from the clicked link */
  const articleSelector = clickedElement.getAttribute('href');
  console.log('articleSelector:', articleSelector); // e.g. "#article-3"

  /* find the correct article using the selector (value of 'href' attribute) */
  const targetArticle = document.querySelector(articleSelector);
  console.log('targetArticle:', targetArticle);

  /* add class 'active' to the correct article */
  if (targetArticle) {
    targetArticle.classList.add('active');
  } else {
    console.warn('No article found for selector:', articleSelector);
  }
};

generateTitleLinks();

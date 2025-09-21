'use strict';

/* =========================
   Selectors / Options
   ========================= */
const optArticleSelector = '.post';                // each article container
const optTitleSelector = '.post-title';            // article title element
const optTitleListSelector = '.titles';            // left sidebar list for titles
const optTagListSelector = '.tags';                // right sidebar: global tags list
const optAuthorsListSelector = '.authors';         // right sidebar: authors list
const optArticleTagsSelector = '.post-tags .list'; // inside article: UL for its tags
const optArticleAuthorSelector = '.post-author';   // inside article: wrapper for author

/* Run AFTER the DOM is ready */
document.addEventListener('DOMContentLoaded', () => {

  /* ===============================================
     Build the list of article titles (with optional filter)
     Example: generateTitleLinks('[data-tags~="design"]')
     =============================================== */
  function generateTitleLinks(customSelector = '') {
    const titleList = document.querySelector(optTitleListSelector);
    if (!titleList) return;

    // clear current list
    titleList.innerHTML = '';

    // collect articles using attribute selector if provided
    const combinedSelector = optArticleSelector + customSelector;
    const articles = document.querySelectorAll(combinedSelector);

    // build HTML for the titles list
    let html = '';
    for (const article of articles) {
      const articleId = article.id;
      const titleEl = article.querySelector(optTitleSelector);
      const articleTitle = (titleEl && titleEl.textContent) || articleId;
      html += `<li><a href="#${articleId}"><span>${articleTitle}</span></a></li>`;
    }
    titleList.innerHTML = html;

    // make title links clickable
    const links = titleList.querySelectorAll('a');
    links.forEach(link => link.addEventListener('click', titleClickHandler));

    // keep UI consistent after filtering
    document.querySelectorAll('.post.active').forEach(el => el.classList.remove('active'));
    if (articles.length) {
      const first = articles[0];
      first.classList.add('active');
      const firstLink = titleList.querySelector(`a[href="#${first.id}"]`);
      if (firstLink) {
        document.querySelectorAll('.titles a.active').forEach(el => el.classList.remove('active'));
        firstLink.classList.add('active');
      }
    }
  }

  /* ===============================================
     Title click behavior: show the chosen article
     =============================================== */
  function titleClickHandler(e) {
    e.preventDefault();

    // deactivate all title links
    document.querySelectorAll('.titles a.active').forEach(a => a.classList.remove('active'));
    // activate the clicked link
    this.classList.add('active');

    // deactivate currently active article(s)
    document.querySelectorAll('.post.active').forEach(a => a.classList.remove('active'));

    // find & activate the target article
    const selector = this.getAttribute('href'); // e.g. "#article-3"
    const target = selector && document.querySelector(selector);
    if (target) target.classList.add('active');
  }

  /* ==========================================================
     Article-level tags: generate links inside each article
     ========================================================== */
  function generateTags() {
    const articles = document.querySelectorAll(optArticleSelector);

    for (const article of articles) {
      const tagsWrapper = article.querySelector(optArticleTagsSelector);
      if (!tagsWrapper) continue;

      const articleTags = article.getAttribute('data-tags') || '';
      const articleTagsArray = articleTags.trim().split(/\s+/).filter(Boolean);

      let html = '';
      for (const tag of articleTagsArray) {
        html += `<li><a href="#tag-${tag}" data-tag="${tag}">${tag}</a></li>`;
      }

      tagsWrapper.innerHTML = html;
    }
  }

  /* ==========================================================
     Right sidebar: global tags with occurrence counters
     ========================================================== */
  function generateTagsSidebar() {
    const tagList = document.querySelector(optTagListSelector);
    if (!tagList) return;

    const counts = new Map();
    const articles = document.querySelectorAll(optArticleSelector);

    for (const article of articles) {
      const tags = (article.getAttribute('data-tags') || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean);

      for (const tag of tags) {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      }
    }

    const items = Array.from(counts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([tag, count]) =>
        `<li><a href="#tag-${tag}" data-tag="${tag}">${tag}</a> <span>(${count})</span></li>`
      )
      .join('');

    tagList.innerHTML = items;
  }

  /* ==========================================================
     Tag click handler (inside posts and in sidebar)
     ========================================================== */
  function tagClickHandler(event) {
    event.preventDefault();

    const clickedElement = this;
    const href = clickedElement.getAttribute('href');   // "#tag-xyz"
    const tag = href.replace('#tag-', '');              // "xyz"

    // remove "active" from ALL tag links
    document
      .querySelectorAll('a.active[href^="#tag-"]')
      .forEach(a => a.classList.remove('active'));

    // add "active" to ALL links that point to this tag
    document
      .querySelectorAll(`a[href="${href}"]`)
      .forEach(a => a.classList.add('active'));

    // filter titles list by this tag
    generateTitleLinks(`[data-tags~="${tag}"]`);
  }

  function addClickListenersToTags() {
    document
      .querySelectorAll('a[data-tag]')
      .forEach(link => link.addEventListener('click', tagClickHandler));
  }

  /* ==========================================================
     Article-level author: generate author link inside each article
     ========================================================== */
  function generateAuthors() {
    const articles = document.querySelectorAll(optArticleSelector);

    for (const article of articles) {
      const wrapper = article.querySelector(optArticleAuthorSelector);
      if (!wrapper) continue;

      const author = article.getAttribute('data-author') || '';
      if (!author) {
        wrapper.textContent = '';
        continue;
      }

      const enc = encodeURIComponent(author);
      wrapper.innerHTML = `by <a href="#author-${enc}" data-author="${author}">${author}</a>`;
    }
  }

  /* ==========================================================
     Right sidebar: authors with occurrence counters
     ========================================================== */
  function generateAuthorsSidebar() {
    const authorsList = document.querySelector(optAuthorsListSelector);
    if (!authorsList) return;

    const counts = new Map();
    const articles = document.querySelectorAll(optArticleSelector);

    for (const article of articles) {
      const author = article.getAttribute('data-author') || '';
      if (!author) continue;
      counts.set(author, (counts.get(author) || 0) + 1);
    }

    const items = Array.from(counts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([author, count]) => {
        const enc = encodeURIComponent(author);
        return `<li><a href="#author-${enc}" data-author="${author}"><span class="author-name">${author}</span></a> <span>(${count})</span></li>`;
      })
      .join('');

    authorsList.innerHTML = items;
  }

  /* ==========================================================
     Author click handler: filter by author
     ========================================================== */
  function authorClickHandler(e) {
    e.preventDefault();

    const clickedElement = this;
    const href = clickedElement.getAttribute('href');   // "#author-George%20Tuxedo"
    const author = clickedElement.dataset.author || decodeURIComponent(href.replace('#author-', ''));

    // remove "active" from ALL author links
    document
      .querySelectorAll('a.active[href^="#author-"]')
      .forEach(a => a.classList.remove('active'));

    // add "active" to ALL links for this author
    document
      .querySelectorAll(`a[href="${href}"]`)
      .forEach(a => a.classList.add('active'));

    // filter titles list by this author (note "=" not "~=")
    generateTitleLinks(`[data-author="${author}"]`);
  }

  function addClickListenersToAuthors() {
    document
      .querySelectorAll('a[data-author]')
      .forEach(link => link.addEventListener('click', authorClickHandler));
  }

  /* =========================
     Bootstrapping on load
     ========================= */
  generateTitleLinks();        // initial titles list (all articles)
  generateTags();              // fill article-level tag lists
  generateTagsSidebar();       // build global tags list
  generateAuthors();           // fill author link in each article
  generateAuthorsSidebar();    // build authors list with counters
  addClickListenersToTags();   // attach tag click listeners (posts + sidebar)
  addClickListenersToAuthors(); // attach author click listeners (posts + sidebar)
});

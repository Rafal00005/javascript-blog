'use strict';

/* =========================
   Selectors / Options
   ========================= */
const optArticleSelector = '.post';               // each article container
const optTitleSelector = '.post-title';           // article title element
const optTitleListSelector = '.titles';           // left sidebar list for titles
const optTagListSelector = '.tags';               // right sidebar: global tags list
const optAuthorsListSelector = '.authors';        // right sidebar: authors list
const optArticleTagsSelector = '.post-tags .list';// inside article: UL for its tags

/* Run AFTER the DOM is ready to avoid querying null elements */
document.addEventListener('DOMContentLoaded', () => {
  /* ===============================================
     Build the list of article titles (with filter)
     filter = { tag?: string, author?: string }
     =============================================== */
  function generateTitleLinks(filter = {}) {
    const titleList = document.querySelector(optTitleListSelector);
    if (!titleList) return;

    // Clear current list
    titleList.innerHTML = '';

    // Collect all articles, then narrow by filters if provided
    let articles = Array.from(document.querySelectorAll(optArticleSelector));

    // Filter by tag if requested
    if (filter.tag) {
      const tag = filter.tag;
      articles = articles.filter(a =>
        (a.getAttribute('data-tags') || '')
          .split(/\s+/)
          .filter(Boolean)
          .includes(tag)
      );
    }

    // Filter by author if requested
    if (filter.author) {
      const author = filter.author;
      articles = articles.filter(a => a.getAttribute('data-author') === author);
    }

    // Build HTML for the titles list
    let html = '';
    for (const article of articles) {
      const articleId = article.id;
      const titleEl = article.querySelector(optTitleSelector);
      const articleTitle = (titleEl && titleEl.textContent) || articleId;
      html += `<li><a href="#${articleId}"><span>${articleTitle}</span></a></li>`;
    }
    titleList.innerHTML = html;

    // Make title links clickable
    const links = titleList.querySelectorAll('a');
    links.forEach(link => link.addEventListener('click', titleClickHandler));

    // Keep UI consistent after filtering
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

    // Deactivate all title links
    document.querySelectorAll('.titles a.active').forEach(a => a.classList.remove('active'));
    // Activate the clicked link
    this.classList.add('active');

    // Deactivate currently active article(s)
    document.querySelectorAll('.post.active').forEach(a => a.classList.remove('active'));

    // Find & activate the target article
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
      // find the <ul> for tags inside THIS article
      const tagsWrapper = article.querySelector(optArticleTagsSelector);
      if (!tagsWrapper) continue;

      // read tags from data attribute
      const articleTags = article.getAttribute('data-tags') || '';

      /* split tags into array */
      const articleTagsArray = articleTags.trim().split(/\s+/);

      // build HTML
      let html = '';
      for (const tag of articleTagsArray) {
        html += `<li><a href="#tag-${tag}" data-tag="${tag}">${tag}</a></li>`;
      }

      // inject + click handlers
      tagsWrapper.innerHTML = html;
      tagsWrapper.querySelectorAll('a[data-tag]').forEach(a =>
        a.addEventListener('click', tagClickHandler)
      );
    }
  }

  /* ==========================================================
     Right sidebar: global tags with occurrence counters
     ========================================================== */
  function generateTagsSidebar() {
    const tagList = document.querySelector(optTagListSelector);
    if (!tagList) return;

    // Count how many times each tag appears across all articles
    const counts = new Map();
    const articles = document.querySelectorAll(optArticleSelector);

    for (const article of articles) {
      const tags = (article.getAttribute('data-tags') || '')
        .split(/\s+/)
        .filter(Boolean);
      for (const tag of tags) counts.set(tag, (counts.get(tag) || 0) + 1);
    }

    // Build an alphabetical list with counters
    const items = Array.from(counts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([tag, count]) => `<li><a href="#tag-${tag}" data-tag="${tag}">${tag}</a> <span>(${count})</span></li>`)
      .join('');

    tagList.innerHTML = items;

    // Click behavior for sidebar tag links
    tagList.querySelectorAll('a[data-tag]').forEach(a =>
      a.addEventListener('click', tagClickHandler)
    );
  }

  /* ==========================================================
     Tag click handler (both inside articles and in sidebar)
     ========================================================== */
  function tagClickHandler(e) {
    e.preventDefault();
    const tag = this.dataset.tag;
    if (!tag) return;

    // Toggle active visuals on tag links (sidebar + inside posts)
    document
      .querySelectorAll(`${optTagListSelector} a.active, .post-tags a.active`)
      .forEach(a => a.classList.remove('active'));
    this.classList.add('active');

    // Filter the titles list to articles that have this tag
    generateTitleLinks({ tag });
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

      // Make the author name inside the article clickable as well
      const authorP = article.querySelector('.post-author');
      if (authorP && !authorP.querySelector('a[data-author]')) {
        const encoded = encodeURIComponent(author);
        authorP.innerHTML = `by <a href="#author-${encoded}" data-author="${author}">${author}</a>`;
        const link = authorP.querySelector('a[data-author]');
        if (link) link.addEventListener('click', authorClickHandler);
      }
    }

    // Build alphabetical list with counters
    const items = Array.from(counts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([author, count]) => {
        const enc = encodeURIComponent(author);
        return `<li><a href="#author-${enc}" data-author="${author}"><span class="author-name">${author}</span></a> <span>(${count})</span></li>`;
      })
      .join('');

    authorsList.innerHTML = items;

    // attach click handlers to sidebar author links
    authorsList.querySelectorAll('a[data-author]').forEach(a =>
      a.addEventListener('click', authorClickHandler)
    );
  }

  /* ==========================================================
     Author click handler: filter by author
     ========================================================== */
  function authorClickHandler(e) {
    e.preventDefault();
    const author = this.dataset.author;
    if (!author) return;

    // Toggle active visuals for author links (sidebar + within posts)
    document
      .querySelectorAll(`${optAuthorsListSelector} a.active, .post-author a.active`)
      .forEach(a => a.classList.remove('active'));
    this.classList.add('active');

    // Filter the titles list by author
    generateTitleLinks({ author });
  }

  /* =========================
     Bootstrapping on load
     ========================= */
  generateTitleLinks();     // initial titles list (all articles)
  generateTags();           // fill article-level tag lists
  generateTagsSidebar();    // build global tags with counters
  generateAuthorsSidebar(); // build authors sidebar with counters
}); // closes DOMContentLoaded

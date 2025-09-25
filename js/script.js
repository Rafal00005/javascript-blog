'use strict';

/* =========================
   Centralized settings options + selectors 
   ========================= */
const opts = {
  tagSizes: {
    count: 5,
    classPrefix: 'tag-size-',
  },
};

const select = {
  all: {
    articles: '.post',
    linksTo: {
      tags: 'a[href^="#tag-"]',
      authors: 'a[href^="#author-"]',
    },
  },
  article: {
    title: '.post-title',
    tags: '.post-tags .list',
    author: '.post-author',
  },
  listOf: {
    titles: '.titles',
    tags: '.tags.list',
    authors: '.authors', // u Ciebie to .authors (nie .authors.list)
  },
};

/* ===============================================
   Helper to compute min/max counts for tags
   =============================================== */
function calculateTagsParams(tags) {
  const params = { max: 0, min: 999999 }; // safe extremes
  for (const tag in tags) {
    const count = tags[tag];
    if (count > params.max) params.max = count;
    if (count < params.min) params.min = count;
  }
  return params;
}

// calculate CSS class for a tag based on its count and min/max params
function calculateTagClass(count, params) {
  if (params.max === params.min) {
    return opts.tagSizes.classPrefix + Math.ceil(opts.tagSizes.count / 2);
  }
  const normalized = (count - params.min) / (params.max - params.min);
  const classNumber = Math.floor(normalized * (opts.tagSizes.count - 1) + 1);
  return opts.tagSizes.classPrefix + classNumber;
}

/* Run AFTER the DOM is ready */
document.addEventListener('DOMContentLoaded', () => {

  /* ===============================================
     Build the list of article titles (with optional filter)
     =============================================== */
  function generateTitleLinks(customSelector = '') {
    const titleList = document.querySelector(select.listOf.titles);
    if (!titleList) return;

    titleList.innerHTML = '';

    const combinedSelector = select.all.articles + customSelector;
    const articles = document.querySelectorAll(combinedSelector);

    let html = '';
    for (const article of articles) {
      const articleId = article.id;
      const titleEl = article.querySelector(select.article.title);
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

  /* ====== Title click behavior : show the chosen article ====== */
  function titleClickHandler(e) {
    e.preventDefault();

    // deactivate all title links
    document.querySelectorAll('.titles a.active').forEach(a => a.classList.remove('active'));
    // activate the clicked link
    this.classList.add('active');

    // deactivate currently active article(s)
    document.querySelectorAll('.post.active').forEach(a => a.classList.remove('active'));

    // find & activate the target article
    const selector = this.getAttribute('href');
    const target = selector && document.querySelector(selector);
    if (target) target.classList.add('active');
  }

  /* ==========================================================
     Article-level tags + tags list in the right sidebar
     ========================================================== */
  function generateTags() {
    const allTags = {}; // tag -> count
    const articles = document.querySelectorAll(select.all.articles);

    for (const article of articles) {
      const tagsWrapper = article.querySelector(select.article.tags);
      if (!tagsWrapper) continue;

      const tagsText = article.getAttribute('data-tags') || '';
      const tags = tagsText.trim().split(/\s+/).filter(Boolean);

      // build article-level tag links
      let html = '';
      for (const tag of tags) {
        const linkHTML = `<li><a href="#tag-${tag}" data-tag="${tag}">${tag}</a></li>`;
        html += linkHTML;

        // count for sidebar
        allTags[tag] = (allTags[tag] || 0) + 1;
      }
      tagsWrapper.innerHTML = html;
    }

    // compute extremes (min/max)
    const tagsParams = calculateTagsParams(allTags);
    console.log('tagsParams:', tagsParams); // e.g. { max: 10, min: 2 }

    const tagList = document.querySelector(select.listOf.tags);
    if (tagList) {
      // generate sidebar tag links with dynamic class
      const sidebarHTML = Object.entries(allTags)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([tag, count]) => {
          const className = calculateTagClass(count, tagsParams);
          return `<li><a href="#tag-${tag}" data-tag="${tag}" class="${className}">${tag}</a></li>`;
        })
        .join('');

      tagList.innerHTML = sidebarHTML;
    }
  }

  /* ==========================================================
     Tag click handler (inside posts and in sidebar)
     ========================================================== */
  function tagClickHandler(event) {
    event.preventDefault();

    const clickedElement = this;
    const href = clickedElement.getAttribute('href');
    const tag = href.replace('#tag-', '');

    // remove "active" from ALL tag links
    document.querySelectorAll('a.active[href^="#tag-"]').forEach(a => a.classList.remove('active'));
    // add "active" to ALL links that point to this tag
    document.querySelectorAll(`a[href="${href}"]`).forEach(a => a.classList.add('active'));

    // filter titles list by this tag
    generateTitleLinks(`[data-tags~="${tag}"]`);
  }

  // ensure we add listeners after generateTags() populates both places
  function addClickListenersToTags() {
    document
      .querySelectorAll('a[data-tag]')
      .forEach(link => link.addEventListener('click', tagClickHandler));
  }

  /* ==========================================================
     Article-level author: generate author link + authors list in sidebar (with counts)
     ========================================================== */
  function generateAuthors() {
    const allAuthors = {};   // author -> count
    const articles = document.querySelectorAll(select.all.articles);

    for (const article of articles) {
      const wrapper = article.querySelector(select.article.author);
      if (!wrapper) continue;

      const author = article.getAttribute('data-author') || '';
      if (!author) {
        wrapper.textContent = '';
        continue;
      }

      // link inside the article
      const enc = encodeURIComponent(author);
      // NOTE: correct attributes: href and data-author
      wrapper.innerHTML = `by <a href="#author-${enc}" data-author="${author}">${author}</a>`;

      // count for sidebar
      allAuthors[author] = (allAuthors[author] || 0) + 1;
    }

    // build right sidebar authors list with counters
    const authorsList = document.querySelector(select.listOf.authors);
    if (authorsList) {
      const items = Object.entries(allAuthors)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([author, count]) => {
          const enc = encodeURIComponent(author);
          return `<li><a href="#author-${enc}" data-author="${author}">${author}</a> <span>(${count})</span></li>`;
        })
        .join('');

      authorsList.innerHTML = items;
    }
  }

  /* ==========================================================
     Author click handler: filter by author
     ========================================================== */
  function authorClickHandler(e) {
    e.preventDefault();

    const clickedElement = this;
    const href = clickedElement.getAttribute('href');
    const author = clickedElement.dataset.author || decodeURIComponent(href.replace('#author-', ''));

    // remove "active" from ALL author links
    document.querySelectorAll('a.active[href^="#author-"]').forEach(a => a.classList.remove('active'));

    // add "active" to ALL links for this author
    document.querySelectorAll(`a[href="${href}"]`).forEach(a => a.classList.add('active'));

    // filter titles list by this author
    generateTitleLinks(`[data-author="${author}"]`);
  }

  function addClickListenersToAuthors() {
    document.querySelectorAll('a[data-author]').forEach(link =>
      link.addEventListener('click', authorClickHandler)
    );
  }

  /* =========================
     Bootstrapping on load
     ========================= */
  generateTitleLinks();
  generateTags();
  generateAuthors();
  addClickListenersToTags();
  addClickListenersToAuthors();
});

'use strict';

/* ============================================================
   Handlebars templates (compiled once; Handlebars loaded in HTML)
   ============================================================ */


const templates = {
  articleLink: Handlebars.compile(
    document.querySelector('#template-article-link').innerHTML
  ),
  tagLink: Handlebars.compile(
    document.querySelector('#template-tag-link').innerHTML
  ),
  authorLink: Handlebars.compile(
    document.querySelector('#template-author-link').innerHTML
  ),
  tagCloudLink: Handlebars.compile(
    document.querySelector('#template-tag-cloud-link').innerHTML
  ),
  authorList: Handlebars.compile(
    document.querySelector('#template-author-list').innerHTML
  ),
};

/* ============================================================
   Selectors & options (kept simple and flat)
   ============================================================ */
const optArticleSelector = '.post';
const optTitleSelector = '.post-title';
const optTitleListSelector = '.titles';

const optArticleTagsSelector = '.post-tags .list';
const optArticleAuthorSelector = '.post-author';

const optTagsListSelector = '.tags';
const optAuthorsListSelector = '.authors';

const optCloudClassCount = 5;
const optCloudClassPrefix = 'tag-size-';

/* ============================================================
   Title click handler (show the chosen article)
   ============================================================ */
function titleClickHandler(event) {
  event.preventDefault();

  const clickedElement = this;

  // Deactivate all title links
  const activeLinks = document.querySelectorAll('.titles a.active');
  for (const link of activeLinks) link.classList.remove('active');

  // Activate clicked link
  clickedElement.classList.add('active');

  // Hide currently active article(s)
  const activeArticles = document.querySelectorAll('.post.active');
  for (const article of activeArticles) article.classList.remove('active');

  // Show target article based on href (e.g., "#article-2")
  const articleSelector = clickedElement.getAttribute('href');
  const targetArticle = document.querySelector(articleSelector);
  if (targetArticle) targetArticle.classList.add('active');
}

/* ============================================================
   Generate title list (optionally filtered by customSelector)
   customSelector example: [data-tags~="news"] or [data-author="John"]
   ============================================================ */
function generateTitleLinks(customSelector = '') {
  const titleList = document.querySelector(optTitleListSelector);
  titleList.innerHTML = '';

  // Select all or filtered articles
  const articles = document.querySelectorAll(optArticleSelector + customSelector);

  // Build all links in memory, inject once
  let html = '';
  for (const article of articles) {
    const articleId = article.getAttribute('id');
    const articleTitle = article.querySelector(optTitleSelector).innerHTML;
    html += templates.articleLink({ id: articleId, title: articleTitle });
  }
  titleList.innerHTML = html;

  // Now wire up click listeners on the freshly rendered links
  const links = titleList.querySelectorAll('a');
  for (const link of links) link.addEventListener('click', titleClickHandler);
}

/* ============================================================
   Helpers for tag cloud sizing
   ============================================================ */
function calculateTagsParams(tags) {
  // tags = { 'news': 6, 'code': 5, ... }
  const params = { min: 999999, max: 0 };
  for (const tag in tags) {
    const count = tags[tag];
    if (count > params.max) params.max = count;
    if (count < params.min) params.min = count;
  }
  return params;
}

function calculateTagClass(count, params) {
  // All counts equal -> return middle class
  if (params.max === params.min) {
    return optCloudClassPrefix + Math.ceil(optCloudClassCount / 2);
  }
  const normalized = (count - params.min) / (params.max - params.min);
  const classNumber = Math.floor(normalized * (optCloudClassCount - 1) + 1);
  return optCloudClassPrefix + classNumber;
}

/* ============================================================
   Generate tags:
   - Per-article tag links
   - Right sidebar tag cloud with size classes
   ============================================================ */
function generateTags() {
  const allTags = {}; // global counter: { tag: occurrences }

  // Per-article tags
  const articles = document.querySelectorAll(optArticleSelector);
  for (const article of articles) {
    const tagsWrapper = article.querySelector(optArticleTagsSelector);
    let html = '';

    // Read tags from data-tags, split on spaces
    const articleTags = article.getAttribute('data-tags') || '';
    const articleTagsArray = articleTags.split(' ').filter(Boolean);

    // Build links and count globally
    for (const tag of articleTagsArray) {
      html += templates.tagLink({ tag });
      allTags[tag] = (allTags[tag] || 0) + 1;
    }

    tagsWrapper.innerHTML = html;
  }

  // Tag cloud in right sidebar
  const tagList = document.querySelector(optTagsListSelector);
  const tagsParams = calculateTagsParams(allTags);

  const allTagsData = { tags: [] };
  for (const tag in allTags) {
    allTagsData.tags.push({
      tag,
      count: allTags[tag],
      className: calculateTagClass(allTags[tag], tagsParams),
    });
  }
  tagList.innerHTML = templates.tagCloudLink(allTagsData);
}

/* ============================================================
   Tag click handler + listeners
   ============================================================ */
function tagClickHandler(event) {
  event.preventDefault();
  const clickedElement = this;

  const href = clickedElement.getAttribute('href'); // "#tag-xyz"
  const tag = href.replace('#tag-', '');

  // Deactivate all active tag links
  const activeTagLinks = document.querySelectorAll('a.active[href^="#tag-"]');
  for (const link of activeTagLinks) link.classList.remove('active');

  // Activate all links that point to the same tag
  const tagLinks = document.querySelectorAll('a[href="' + href + '"]');
  for (const link of tagLinks) link.classList.add('active');

  // Filter titles by tag
  generateTitleLinks('[data-tags~="' + tag + '"]');
}

function addClickListenersToTags() {
  const links = document.querySelectorAll('a[href^="#tag-"]');
  for (const link of links) link.addEventListener('click', tagClickHandler);
}

/* ============================================================
   Generate authors:
   - Per-article author link (under title)
   - Right sidebar authors list with counts
   ============================================================ */
function generateAuthors() {
  const allAuthors = {}; // { 'Name Surname': articleCount }

  const articles = document.querySelectorAll(optArticleSelector);
  for (const article of articles) {
    const authorWrapper = article.querySelector(optArticleAuthorSelector);
    const authorName = article.getAttribute('data-author') || '';
    const encoded = encodeURIComponent(authorName);

    // Article-level author link
    authorWrapper.innerHTML = templates.authorLink({
      name: authorName,
      encoded,
    });

    // Sidebar counts
    allAuthors[authorName] = (allAuthors[authorName] || 0) + 1;
  }

  // Build sidebar list
  const authorsList = document.querySelector(optAuthorsListSelector);
  const allAuthorsData = { authors: [] };

  for (const name in allAuthors) {
    allAuthorsData.authors.push({
      name,
      encoded: encodeURIComponent(name),
      count: allAuthors[name],
    });
  }

  authorsList.innerHTML = templates.authorList(allAuthorsData);
}

/* ============================================================
   Author click handler + listeners
   ============================================================ */
function authorClickHandler(event) {
  event.preventDefault();
  const clickedElement = this;

  const href = clickedElement.getAttribute('href'); // "#author-Encoded"
  const author =
    clickedElement.getAttribute('data-author') ||
    decodeURIComponent(href.replace('#author-', ''));

  // Deactivate all active author links
  const activeAuthorLinks = document.querySelectorAll('a.active[href^="#author-"]');
  for (const link of activeAuthorLinks) link.classList.remove('active');

  // Activate all links that point to the same author
  const authorLinks = document.querySelectorAll('a[href="' + href + '"]');
  for (const link of authorLinks) link.classList.add('active');

  // Filter titles by author (exact match)
  generateTitleLinks('[data-author="' + author + '"]');
}

function addClickListenersToAuthors() {
  const links = document.querySelectorAll('a[href^="#author-"]');
  for (const link of links) link.addEventListener('click', authorClickHandler);
}

/* ============================================================
   Boot sequence
   ============================================================ */
generateTitleLinks();       // initial titles list
generateTags();             // per-article tags + tag cloud
addClickListenersToTags();  // tag interactions (both places)
generateAuthors();          // per-article author + sidebar list
addClickListenersToAuthors(); // author interactions

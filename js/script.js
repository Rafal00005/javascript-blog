'use strict';

/* ===============================================
   Handlebars templates (compiled when DOM is ready)
   =============================================== */
var templates = null;

/* =========================
   Centralized settings options + selectors 
   ========================= */
var opts = {
  tagSizes: {
    count: 5,
    classPrefix: 'tag-size-'
  }
};

var select = {
  all: {
    articles: '.post',
    linksTo: {
      tags: 'a[href^="#tag-"]',
      authors: 'a[href^="#author-"]'
    }
  },
  article: {
    title: '.post-title',
    tags: '.post-tags .list',
    author: '.post-author'
  },
  listOf: {
    titles: '.titles',
    tags: '.tags.list',
    authors: '.authors'
  }
};

/* ===============================================
   Helper to compute min/max counts for tags
   =============================================== */
function calculateTagsParams(tags) {
  var params = { max: 0, min: 999999 }; // safe extremes
  for (var tag in tags) {
    if (!tags.hasOwnProperty(tag)) continue;
    var count = tags[tag];
    if (count > params.max) params.max = count;
    if (count < params.min) params.min = count;
  }
  return params;
}

// Calculate CSS class for a tag based on its count and min/max params
function calculateTagClass(count, params) {
  if (params.max === params.min) {
    // Avoid division by zero: assign the middle class
    return opts.tagSizes.classPrefix + Math.ceil(opts.tagSizes.count / 2);
  }
  var normalized = (count - params.min) / (params.max - params.min);
  var classNumber = Math.floor(normalized * (opts.tagSizes.count - 1) + 1);
  return opts.tagSizes.classPrefix + classNumber;
}

/* Run AFTER the DOM is ready */
document.addEventListener('DOMContentLoaded', function () {
  /* ===============================================
     Compile Handlebars templates (simple & ultra-safe)
     =============================================== */
  if (typeof Handlebars === 'undefined') {
    console.error('Handlebars is not defined. Load the Handlebars CDN BEFORE js/script.js.');
    return;
  }

  var tplArticleEl = document.getElementById('template-article-link');
  var tplTagCloudEl = document.getElementById('template-tag-cloud-link');

  if (!tplArticleEl) {
    console.error('Template #template-article-link not found in DOM.');
    return;
  }

  var articleTplSrc = tplArticleEl.textContent ? tplArticleEl.textContent.trim() : '';
  if (!articleTplSrc) {
    console.error('#template-article-link is empty.');
    return;
  }

  var tagTplSrc = (tplTagCloudEl && tplTagCloudEl.textContent)
    ? tplTagCloudEl.textContent.trim()
    : '';

  // Compile templates once and reuse later (ultra-safe, no object literal)
  templates = {}; // create container object
  templates.articleLink = Handlebars.compile(articleTplSrc);
  if (tagTplSrc && tagTplSrc.length) {
    templates.tagCloudLink = Handlebars.compile(tagTplSrc);
  } else {
    templates.tagCloudLink = null;
  }

  /* ===============================================
     Build the list of article titles (with optional filter)
     =============================================== */
  function generateTitleLinks(customSelector) {
    if (typeof customSelector === 'undefined') customSelector = '';

    var titleList = document.querySelector(select.listOf.titles);
    if (!titleList) return;

    // Reset current list
    titleList.innerHTML = '';

    // Build NodeList of articles (optionally filtered)
    var combinedSelector = select.all.articles + customSelector;
    var articles = document.querySelectorAll(combinedSelector);

    // Build links using Handlebars template
    var html = '';
    for (var i = 0; i < articles.length; i++) {
      var article = articles[i];
      var articleId = article.id;
      var titleEl = article.querySelector(select.article.title);
      var articleTitle = (titleEl && titleEl.textContent) ? titleEl.textContent : articleId;

      var linkHTML = templates.articleLink({ id: articleId, title: articleTitle });
      html += linkHTML;
    }

    // Inject links into the titles list
    titleList.innerHTML = html;

    // Make title links clickable
    var links = titleList.querySelectorAll('a');
    for (var j = 0; j < links.length; j++) {
      links[j].addEventListener('click', titleClickHandler);
    }

    // Keep UI consistent after filtering: activate the first visible article
    var activePosts = document.querySelectorAll('.post.active');
    for (var k = 0; k < activePosts.length; k++) {
      activePosts[k].classList.remove('active');
    }

    if (articles.length) {
      var first = articles[0];
      first.classList.add('active');
      var firstLink = titleList.querySelector('a[href="#' + first.id + '"]');
      if (firstLink) {
        var activeTitleLinks = document.querySelectorAll('.titles a.active');
        for (var m = 0; m < activeTitleLinks.length; m++) {
          activeTitleLinks[m].classList.remove('active');
        }
        firstLink.classList.add('active');
      }
    }
  }

  /* ====== Title click behavior : show the chosen article ====== */
  function titleClickHandler(e) {
    e.preventDefault();

    // Deactivate all title links
    var activeTitleLinks = document.querySelectorAll('.titles a.active');
    for (var i = 0; i < activeTitleLinks.length; i++) {
      activeTitleLinks[i].classList.remove('active');
    }
    // Activate the clicked link
    this.classList.add('active');

    // Deactivate currently active article(s)
    var activePosts = document.querySelectorAll('.post.active');
    for (var j = 0; j < activePosts.length; j++) {
      activePosts[j].classList.remove('active');
    }

    // Find & activate the target article
    var selector = this.getAttribute('href');
    var target = selector ? document.querySelector(selector) : null;
    if (target) target.classList.add('active');
  }

  /* ==========================================================
     Article-level tags + tags list in the right sidebar
     ========================================================== */
  function generateTags() {
    var allTags = {}; // tag -> count
    var articles = document.querySelectorAll(select.all.articles);

    // Build per-article inline tag links and collect global counts
    for (var i = 0; i < articles.length; i++) {
      var article = articles[i];
      var tagsWrapper = article.querySelector(select.article.tags);
      if (!tagsWrapper) continue;

      var tagsText = article.getAttribute('data-tags') || '';
      var tags = tagsText.trim().length ? tagsText.trim().split(/\s+/) : [];

      // Build article-level tag links (simple HTML)
      var html = '';
      for (var t = 0; t < tags.length; t++) {
        var tag = tags[t];
        html += '<li><a href="#tag-' + tag + '" data-tag="' + tag + '">' + tag + '</a></li>';

        // Increment global counter for sidebar cloud
        if (!allTags[tag]) allTags[tag] = 0;
        allTags[tag] += 1;
      }
      tagsWrapper.innerHTML = html;
    }

    // Compute extremes (min/max) for class mapping
    var tagsParams = calculateTagsParams(allTags);

    // Render the sidebar tag cloud
    var tagList = document.querySelector(select.listOf.tags);
    if (!tagList) return;

    if (templates && typeof templates.tagCloudLink === 'function') {
      // Build data object for Handlebars
      var allTagsData = { tags: [] };
      var keys = [];
      for (var key in allTags) {
        if (allTags.hasOwnProperty(key)) keys.push(key);
      }
      keys.sort(function (a, b) { return a.localeCompare(b); });
      for (var x = 0; x < keys.length; x++) {
        var tg = keys[x];
        allTagsData.tags.push({
          tag: tg,
          count: allTags[tg],
          className: calculateTagClass(allTags[tg], tagsParams)
        });
      }
      tagList.innerHTML = templates.tagCloudLink(allTagsData);
    } else {
      // Fallback: basic HTML string
      var keys2 = [];
      for (var key2 in allTags) {
        if (allTags.hasOwnProperty(key2)) keys2.push(key2);
      }
      keys2.sort(function (a, b) { return a.localeCompare(b); });

      var cloudHTML = '';
      for (var y = 0; y < keys2.length; y++) {
        var name = keys2[y];
        var cls = calculateTagClass(allTags[name], tagsParams);
        cloudHTML += '<li><a href="#tag-' + name + '" data-tag="' + name + '" class="' + cls + '">' + name + '</a></li>';
      }
      tagList.innerHTML = cloudHTML;
    }
  }

  /* ==========================================================
     Tag click handler (inside posts and in sidebar)
     ========================================================== */
  function tagClickHandler(event) {
    event.preventDefault();

    var clickedElement = this;
    var href = clickedElement.getAttribute('href');

    // Remove "active" from ALL tag links
    var activeTags = document.querySelectorAll('a.active[href^="#tag-"]');
    for (var i = 0; i < activeTags.length; i++) {
      activeTags[i].classList.remove('active');
    }
    // Add "active" to ALL links that point to this tag
    var sameTagLinks = document.querySelectorAll('a[href="' + href + '"]');
    for (var j = 0; j < sameTagLinks.length; j++) {
      sameTagLinks[j].classList.add('active');
    }

    // Extract tag and filter titles
    var tag = href.replace('#tag-', '');
    generateTitleLinks('[data-tags~="' + tag + '"]');
  }

  // Ensure listeners are added after generateTags() populates both places
  function addClickListenersToTags() {
    var links = document.querySelectorAll('a[data-tag]');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', tagClickHandler);
    }
  }

  /* ==========================================================
     Article-level author: generate author link + authors list in sidebar (with counts)
     ========================================================== */
  function generateAuthors() {
    var allAuthors = {};   // author -> count
    var articles = document.querySelectorAll(select.all.articles);

    for (var i = 0; i < articles.length; i++) {
      var article = articles[i];
      var wrapper = article.querySelector(select.article.author);
      if (!wrapper) continue;

      var author = article.getAttribute('data-author') || '';
      if (!author) {
        wrapper.textContent = '';
        continue;
      }

      // Link inside the article
      var enc = encodeURIComponent(author);
      wrapper.innerHTML = 'by <a href="#author-' + enc + '" data-author="' + author + '">' + author + '</a>';

      // Count for sidebar
      if (!allAuthors[author]) allAuthors[author] = 0;
      allAuthors[author] += 1;
    }

    // Build right sidebar authors list with counters
    var authorsList = document.querySelector(select.listOf.authors);
    if (!authorsList) return;

    // Collect, sort keys and render
    var authorNames = [];
    for (var a in allAuthors) {
      if (allAuthors.hasOwnProperty(a)) authorNames.push(a);
    }
    authorNames.sort(function (x, y) { return x.localeCompare(y); });

    var items = '';
    for (var j = 0; j < authorNames.length; j++) {
      var name = authorNames[j];
      var encName = encodeURIComponent(name);
      items += '<li><a href="#author-' + encName + '" data-author="' + name + '">' + name + '</a> <span>(' + allAuthors[name] + ')</span></li>';
    }
    authorsList.innerHTML = items;
  }

  /* ==========================================================
     Author click handler: filter by author
     ========================================================== */
  function authorClickHandler(e) {
    e.preventDefault();

    var clickedElement = this;
    var href = clickedElement.getAttribute('href');
    var author = clickedElement.getAttribute('data-author') || decodeURIComponent(href.replace('#author-', ''));

    // Remove "active" from ALL author links
    var activeAuthors = document.querySelectorAll('a.active[href^="#author-"]');
    for (var i = 0; i < activeAuthors.length; i++) {
      activeAuthors[i].classList.remove('active');
    }

    // Add "active" to ALL links for this author
    var sameAuthorLinks = document.querySelectorAll('a[href="' + href + '"]');
    for (var j = 0; j < sameAuthorLinks.length; j++) {
      sameAuthorLinks[j].classList.add('active');
    }

    // Filter titles list by this author
    generateTitleLinks('[data-author="' + author + '"]');
  }

  function addClickListenersToAuthors() {
    var links = document.querySelectorAll('a[data-author]');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', authorClickHandler);
    }
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

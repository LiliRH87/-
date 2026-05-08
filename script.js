// script.js - Прелоадер (первый визит) + Плавное появление сайта + Поиск

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Fully Loaded');

    // --- Логика Прелоадера и Появления Сайта ---
    const preloader = document.getElementById('preloader');
    const siteWrapper = document.querySelector('.site-wrapper'); // Получаем главный контейнер сайта
    const visitedFlag = 'hasVisitedBefore';

    if (preloader && siteWrapper) { // Убедимся, что оба элемента существуют
        if (localStorage.getItem(visitedFlag)) {
            // Пользователь уже был - удаляем прелоадер и ПОКАЗЫВАЕМ сайт
            console.log('Returning visitor. Removing preloader, showing site.');
            preloader.remove();
            siteWrapper.classList.add('site-loaded'); // <<< Показываем сайт СРАЗУ
        } else {
            // Первый визит - CSS сам запустит анимацию прелоадера.
            console.log('First visit. CSS preloader animation running.');
            // Устанавливаем таймер на ПОКАЗ сайта и удаление прелоадера ПОСЛЕ анимации
            setTimeout(() => {
                console.log('Preloader animation complete. Showing site and removing preloader element.');
                siteWrapper.classList.add('site-loaded'); // <<< Показываем сайт ПОСЛЕ анимации прелоадера
                try {
                     localStorage.setItem(visitedFlag, 'true');
                     console.log('Visited flag set in localStorage.');
                } catch (e) {
                     console.error('Failed to set visited flag in localStorage:', e);
                }
                preloader.remove(); // Удаляем элемент прелоадера из DOM
            }, 5000); // 5 секунд (чуть больше чем 4.8с анимации прелоадера)
        }
    } else {
        // Если прелоадера или обертки нет, просто пытаемся показать сайт
        if (siteWrapper) {
             siteWrapper.classList.add('site-loaded');
        }
        console.warn('Preloader or Site Wrapper not found. Skipping preloader logic.');
    }
    // --- Конец логики Прелоадера ---


    // --- Обновление года в футере ---
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // --- Элементы управления ---
    const grid = document.querySelector('.monuments-grid');
    const showMoreBtn = document.getElementById('show-more-btn');
    const searchInput = document.getElementById('hero-search');
    const itemsPerLoad = 6;

    let allCards = [];
    let observer;

    // --- Инициализация (остается без изменений) ---
    function initializeSite() {
        if (grid && searchInput) {
            allCards = Array.from(grid.querySelectorAll('.monument-card'));
            console.log(`Total cards found: ${allCards.length}`);

            if (allCards.length === 0) {
                console.warn('No cards found in the grid.');
                if (showMoreBtn) showMoreBtn.classList.add('hidden');
                 searchInput.disabled = true;
            } else {
                 setupSearchListener();
                 applySearchAndPagination();
                 setupShowMoreListener();
            }
        } else {
             console.log('Grid or Search Input not found on this page. Assuming detail page.');
             if (showMoreBtn) showMoreBtn.style.display = 'none';
        }

        initializeObserver();
        setupSmoothScroll();
    }

    // --- Логика Поиска (остается без изменений) ---
    function setupSearchListener() {
        searchInput.addEventListener('input', () => {
            applySearchAndPagination();
        });
    }

    function applySearchAndPagination() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        console.log(`Applying search "${searchTerm}" and resetting pagination.`);
        let visibleCardsAfterSearch = [];
        allCards.forEach(card => {
            const cardTitleElement = card.querySelector('.card-title');
            const cardTitle = cardTitleElement ? cardTitleElement.textContent.trim().toLowerCase() : '';
            const matchesSearch = searchTerm === '' || cardTitle.includes(searchTerm);
            card.classList.remove('card-searched-out', 'hidden-card', 'is-visible');
            if (matchesSearch) {
                visibleCardsAfterSearch.push(card);
            } else {
                card.classList.add('card-searched-out');
            }
        });
        console.log(`Cards matching search "${searchTerm}": ${visibleCardsAfterSearch.length}`);
        visibleCardsAfterSearch.forEach((card, index) => {
            if (index >= itemsPerLoad) {
                card.classList.add('hidden-card');
            }
        });
        updateShowMoreButtonState();
        setTimeout(initializeObserver, 50);
    }

    // --- Логика "Показать еще" (остается без изменений) ---
     function setupShowMoreListener() {
        if (showMoreBtn) {
            showMoreBtn.addEventListener('click', () => {
                console.log('--- "Show More" button clicked ---');
                const hiddenMatchingCards = grid.querySelectorAll('.monument-card:not(.card-searched-out).hidden-card');
                console.log(`Found ${hiddenMatchingCards.length} hidden matching cards.`);
                let itemsShownThisClick = 0;
                hiddenMatchingCards.forEach((card) => {
                    if (itemsShownThisClick < itemsPerLoad) {
                        card.classList.remove('hidden-card');
                        card.classList.remove('is-visible');
                        itemsShownThisClick++;
                    }
                });
                console.log(`Items shown this click: ${itemsShownThisClick}`);
                updateShowMoreButtonState();
                setTimeout(initializeObserver, 50);
            });
        }
    }

    function updateShowMoreButtonState() {
        if (!showMoreBtn || !grid) return;
        const hiddenMatchingCards = grid.querySelectorAll('.monument-card:not(.card-searched-out).hidden-card');
        if (hiddenMatchingCards.length > 0) {
            showMoreBtn.classList.remove('hidden');
            showMoreBtn.style.display = '';
        } else {
            showMoreBtn.classList.add('hidden');
        }
        console.log(`Hidden cards matching search results: ${hiddenMatchingCards.length}. Show More button visible: ${!showMoreBtn.classList.contains('hidden')}`);
    }

    // --- Анимация при прокрутке (остается без изменений) ---
    function initializeObserver() {
        console.log('Observer: Initializing...');
        if (observer) {
            observer.disconnect();
            console.log('Observer: Disconnected previous instance.');
        }
        const elementsToObserve = document.querySelectorAll('.animate-on-scroll:not(.is-visible):not(.hidden-card):not(.card-searched-out)');
        console.log(`Observer: Found ${elementsToObserve.length} elements to observe.`);
        if (elementsToObserve.length > 0) {
            observer = new IntersectionObserver((entries, obs) => {
                entries.forEach((entry) => {
                     if (entry.isIntersecting &&
                         !entry.target.classList.contains('hidden-card') &&
                         !entry.target.classList.contains('card-searched-out'))
                     {
                        console.log('Observer: Element intersecting, adding .is-visible:', entry.target);
                        entry.target.classList.add('is-visible');
                        const isCard = entry.target.classList.contains('monument-card');
                        const hasStagger = entry.target.classList.contains('stagger');
                        if (isCard && grid && hasStagger) {
                            const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
                            const cardIndex = allCards.indexOf(entry.target);
                            if (cardIndex !== -1) {
                                if (cardIndex < itemsPerLoad && searchTerm === '') {
                                    const staggerIndexValue = cardIndex;
                                    entry.target.style.setProperty('--stagger-index', staggerIndexValue);
                                    entry.target.style.transitionDelay = '';
                                    console.log(`Observer: Applied stagger index ${staggerIndexValue} to INITIAL card (no search).`, entry.target);
                                } else {
                                    entry.target.style.setProperty('--stagger-index', '0');
                                    entry.target.style.transitionDelay = '0s';
                                    console.log('Observer: Setting delay 0s for LATER card or ACTIVE search.', entry.target);
                                }
                            } else {
                                 entry.target.style.transitionDelay = '0s';
                                 console.log('Observer: Card not found in array, setting delay 0s', entry.target);
                            }
                        } else if (hasStagger) {
                            entry.target.style.transitionDelay = '';
                            console.log('Observer: Non-card element with stagger', entry.target);
                        } else {
                            entry.target.style.transitionDelay = '0s';
                            console.log('Observer: No stagger class, setting delay 0s', entry.target);
                        }
                        obs.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1
            });
            elementsToObserve.forEach(element => {
                observer.observe(element);
            });
        } else {
            console.log('Observer: No new elements to observe.');
        }
    }

    // --- Плавная прокрутка к якорю (остается без изменений) ---
    function setupSmoothScroll() {
        const scrollLink = document.querySelector('.scroll-down-link');
        if (scrollLink) {
            scrollLink.addEventListener('click', (event) => {
                event.preventDefault();
                const targetId = scrollLink.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        }
    }

    // --- Запуск ---
    initializeSite(); // Вызываем инициализацию в конце

}); // Конец DOMContentLoaded
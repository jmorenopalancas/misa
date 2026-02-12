        
		// Array de idiomas
        let languages = ['es', 'ca', 'en', 'tl', 'la'];
        
        // Dynamic content variables
        let currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
        let dynamicContent = {};
        const params = new URLSearchParams(window.location.search);
        let detectedLang = (params.get('lang') || navigator.language || navigator.userLanguage || 'es').split('-')[0];
		// Verificar que este se encuentre en el array anterior sino asignarle un valor por defecto
		if (!languages.includes(detectedLang)) {
				detectedLang = 'es';
		}
		// Cambiar idioma
		switchLanguage(detectedLang);
	
		// Ejecutar el ajuste de alturas al cargar la página cargando todos los idiomas
		document.addEventListener('DOMContentLoaded', function(event) { 
			var languagesToLoad = languages.length;
			var languagesLoaded = 0;
			
			// Load dynamic content for all languages first
			languages.forEach(function(tempLang) {
				loadDynamicContent(tempLang, function() {
					languagesLoaded++;
					// Once all languages are loaded, proceed with UI setup
					if (languagesLoaded === languagesToLoad) {
						// Switch through all languages to process dynamic content
						languages.forEach(function(lang) {
							switchLanguage(lang);
						});
						// Set final language and adjust heights
						switchLanguage(detectedLang);
						adjustMinHeight();
						console.log('All dynamic content loaded for all languages');
					}
				});
			});
		});
		
        function switchLanguage(showLang) {

			// Crear lista de idiomas a esconder, excluyendo el idioma 'showLang' a mostrar de la lista
			let hideLang = languages.map(lang => '.' + lang).join(',');
			hideLang = hideLang.split(',').filter(langItem => langItem !== '.' + showLang).join(',');
            // Ocultar elementos
            var hideElements = document.querySelectorAll(hideLang);
            for (var i = 0; i < hideElements.length; i++) {
                hideElements[i].classList.add('hide');
				//console.log(hideElements[i].className);
            }
			console.log('hideLang = ' + hideLang);
            // Mostrar elementos
            var showElements = document.querySelectorAll('.' + showLang);
            for (var i = 0; i < showElements.length; i++) {
                showElements[i].classList.remove('hide');
				//console.log(showElements[i].className);
            }
			// Ajustar alturas conforme al contenido de cada idioma
			adjustMinHeight();
			
			// Actualizar parámetro en la URL
			updateLangParameter(showLang);
        }
		function adjustMinHeight() {
            // Calcular y asignar la altura máxima a cada grupo de párrafos
            var sections = document.querySelectorAll('.section');
            sections.forEach(function(section) {
                var minHeight = 0;

                // Obtener todos los párrafos en el grupo actual
                var paragraphs = section.querySelectorAll('p.adjust-height,h2,h3,h4,h5,li');
                paragraphs.forEach(function(paragraph) {
                    // Mostrar temporalmente para medir la altura
                    paragraph.style.display = 'block';
                    var height = paragraph.getBoundingClientRect().height;
                    paragraph.style.display = '';

                    // Actualizar la altura máxima encontrada
                    if (height > minHeight) {
                        minHeight = height;
                    }
                });
                // Asignar la altura máxima como min-height a todos los párrafos del grupo
                paragraphs.forEach(function(paragraph) {
                    paragraph.style.minHeight = minHeight + 'px';
                });	
            });		
		}
        // Función para actualizar o añadir el parámetro 'lang'
        function updateLangParameter(newLang) {
            const url = new URL(window.location);
            const params = new URLSearchParams(url.search);

            // Reemplazar o añadir el parámetro 'lang'
            params.set('lang', newLang);

            // Actualizar la URL sin recargar la página
            window.history.replaceState({}, '', url.pathname + '?' + params);
        }
        
        // Function to fetch dynamic content from API
        function loadDynamicContent(language, callback) {
            // Check if content already loaded for this language
            if (dynamicContent[language]) {
                console.log('Dynamic content already loaded for language:', language);
                if (callback) callback();
                return;
            }
            
            console.log('Loading dynamic content for language:', language);
            
            var apiUrl = 'https://gxvchjojub.execute-api.eu-west-1.amazonaws.com/production/getmissafreecontent?lang=' + language + '&day=' + currentDate;
            console.log('Fetching from:', apiUrl);
            
            fetch(apiUrl)
                .then(function(response) {
                    if (!response.ok) {
                        throw new Error('HTTP error! status: ' + response.status);
                    }
                    return response.json();
                })
                .then(function(data) {
                    console.log('Dynamic content loaded for', language + ':', data);
                    dynamicContent[language] = data;
                    // Replace placeholders with actual content
                    replacePlaceholders(data, language);
                    if (callback) callback();
                })
                .catch(function(error) {
                    console.error('Error loading dynamic content for', language + ':', error);
                    if (callback) callback(); // Still call callback to continue loading other languages
                });
        }
        
        // Function to replace placeholders in HTML
        function replacePlaceholders(data, currentLanguage) {
            console.log('=== PLACEHOLDER REPLACEMENT DEBUG ===');
            console.log('Full data received:', JSON.stringify(data, null, 2));
            console.log('Available keys in data:', Object.keys(data));
            console.log('Current language:', currentLanguage);
            
            var dynamicSections = document.querySelectorAll('.dynamic-content');
            
            if (!dynamicSections.length) {
                console.log('No dynamic content sections found');
                return;
            }
            
            console.log('Found', dynamicSections.length, 'dynamic content section(s)');
            
            // Process each dynamic content section
            dynamicSections.forEach(function(dynamicSection, index) {
                console.log('Processing dynamic section', index + 1, 'of', dynamicSections.length);
                
                // Get the HTML content and replace placeholders
                var htmlContent = dynamicSection.innerHTML;
                console.log('Original HTML for section', index + 1 + ':', htmlContent);
                
                // Extract all placeholders first to see what we're working with
                var placeholders = htmlContent.match(/{[^}]+}/g);
                console.log('Found placeholders in section', index + 1 + ':', placeholders);
                
                // Replace placeholders in the format {language>key>property}
                htmlContent = htmlContent.replace(/{([^}]+)}/g, function(match, placeholder) {
                console.log('=== Processing:', match, '===');
                console.log('Placeholder content:', placeholder);
                
                // Decode HTML entities (e.g., &gt; becomes >)
                var decodedPlaceholder = placeholder.replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
                console.log('Decoded placeholder:', decodedPlaceholder);
                
                var parts = decodedPlaceholder.split('>');
                
                // Check if we have the expected 3 parts: language>key>property
                if (parts.length !== 3) {
                    console.log('WARNING: Unexpected placeholder format, expected language>key>property');
                    return match; // Return original if format is unexpected
                }
                
                var placeholderLanguage = parts[0];
                var key = parts[1];
                var property = parts[2];
                
                console.log('Extracted language:', "'" + placeholderLanguage + "'", 'key:', "'" + key + "'", 'property:', "'" + property + "'");
                
                // Only process placeholders for the current language
                if (placeholderLanguage !== currentLanguage) {
                    console.log('SKIP: Placeholder language', placeholderLanguage, 'does not match current language', currentLanguage);
                    return match; // Return original placeholder unchanged
                }
                
                console.log('Key exists in data?', data.hasOwnProperty(key));
                
                if (data[key]) {
                    console.log('SUCCESS: Found key', key);
                    console.log('Data for key:', JSON.stringify(data[key], null, 2));
                    console.log('Available properties:', Object.keys(data[key]));
                    console.log('Property exists?', data[key].hasOwnProperty(property));
                    
                    if (data[key][property]) {
                        console.log('SUCCESS: Found property', property, 'with value:', data[key][property]);
                        return data[key][property];
                    } else {
                        console.log('ERROR: Property', property, 'not found in', key);
                    }
                } else {
                    console.log('ERROR: Key', key, 'not found in data');
                    console.log('Available keys are:', Object.keys(data));
                }
                
                return '[' + decodedPlaceholder + ' not found]';
            });
            
            // Set the updated HTML content for this section
            dynamicSection.innerHTML = htmlContent;
            console.log('Final HTML result for section', index + 1 + ':', htmlContent);
        });
        
        // Adjust heights after all sections are processed
        adjustMinHeight();
        console.log('=== END DEBUG ===');
        }

let lastTouchDist = 0;
let baseFontSize  = parseFloat(getComputedStyle(document.documentElement).fontSize);
let baseMinHeight = parseFloat(getComputedStyle(document.documentElement).minHeight);

document.addEventListener('touchmove', function(e) {
    if (e.touches.length == 2) {
        let touch1 = e.touches[0];
        let touch2 = e.touches[1];

        let touchDist = Math.hypot(touch2.pageX - touch1.pageX, touch2.pageY - touch1.pageY);

        if (lastTouchDist) {
            let delta = touchDist - lastTouchDist;
            if (Math.abs(delta) > 5) { // Sensibilidad al pellizco
                if (delta > 0) {
                    baseFontSize  *= 1.05; // Aumenta el tamaño de la fuente
					baseMinHeight *= 1.05;
                } else {
                    baseFontSize  *= 0.95; // Disminuye el tamaño de la fuente
					baseMinHeight *= 0.95;
                }
				document.documentElement.style.fontSize  = baseFontSize  + 'px';
				document.documentElement.style.minHeight = baseMinHeight + 'px';
            }
        }
        lastTouchDist = touchDist;
    }
}, false);

document.addEventListener('touchend', function() {
    lastTouchDist = 0;
}, false);

// Header scroll behavior for mobile devices
let lastScrollTop = 0;
let ticking = false;
let isHeaderHidden = false;
let scrollThreshold = 1; // Minimum scroll distance to trigger hide/show

function updateHeader() {
    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const header = document.querySelector('.header');
    
    // Only apply on mobile screens (max-width: 768px)
    if (window.innerWidth <= 768) {
        const scrollDifference = currentScrollTop - lastScrollTop;
        
        // If scrolling down and not already hidden
        if (scrollDifference > scrollThreshold && !isHeaderHidden && currentScrollTop > 100) {
            header.classList.add('header-hidden');
            isHeaderHidden = true;
        }
        // If scrolling up and currently hidden
        else if (scrollDifference < -scrollThreshold && isHeaderHidden) {
            header.classList.remove('header-hidden');
            isHeaderHidden = false;
        }
        // Show header when at top of page
        else if (currentScrollTop <= 50 && isHeaderHidden) {
            header.classList.remove('header-hidden');
            isHeaderHidden = false;
        }
    } else {
        // On desktop, always show header
        if (isHeaderHidden) {
            header.classList.remove('header-hidden');
            isHeaderHidden = false;
        }
    }
    
    lastScrollTop = currentScrollTop;
    ticking = false;
}

function requestTick() {
    if (!ticking) {
        requestAnimationFrame(updateHeader);
        ticking = true;
    }
}

// Listen for scroll events
window.addEventListener('scroll', requestTick, { passive: true });

// Listen for touch events on mobile to also trigger header show (when user touches screen)
document.addEventListener('touchstart', function() {
    if (window.innerWidth <= 768 && isHeaderHidden) {
        const header = document.querySelector('.header');
        header.classList.remove('header-hidden');
        isHeaderHidden = false;
    }
}, { passive: true });

// Listen for window resize to reset header state when switching between mobile/desktop
window.addEventListener('resize', function() {
    const header = document.querySelector('.header');
    if (window.innerWidth > 768 && isHeaderHidden) {
        header.classList.remove('header-hidden');
        isHeaderHidden = false;
    }
});
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from bs4 import BeautifulSoup
import csv
import os
import datetime, time
import re
import random

URL = "https://www.etsy.com/in-en/listing/4364399853/eepy-cat-silly-sleepy-cat-unhinged"

def setup_driver():
    """Setup Chrome driver with enhanced options"""
    options = webdriver.ChromeOptions()
    # Remove headless mode for debugging - you can add it back later
    # options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)
    options.add_argument("--window-size=1920,1080")
    
    # Use a more realistic user agent
    options.add_argument("user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
    
    driver = webdriver.Chrome(options=options)
    
    # Execute script to hide automation indicators
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    
    return driver

def scroll_to_reviews(driver):
    """Scroll to reviews section to trigger loading"""
    print("Scrolling to load reviews...")
    
    # Try to find and scroll to reviews section
    try:
        # Look for reviews heading or section
        reviews_section = driver.find_element(By.XPATH, "//h2[contains(text(), 'Reviews') or contains(text(), 'review')]")
        driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", reviews_section)
        time.sleep(3)
        return True
    except NoSuchElementException:
        # If reviews heading not found, scroll down gradually
        for i in range(5):
            driver.execute_script(f"window.scrollTo(0, document.body.scrollHeight * {(i+1)/5});")
            time.sleep(2)
        return False

def wait_for_reviews(driver, wait):
    """Wait for reviews to load with multiple strategies"""
    review_selectors = [
        "[data-test-id='review-card']",
        ".shop2-review-review",
        ".reviews-list .review",
        "[data-region='review']",
        ".review-text",
        "[data-test-id='reviews-section'] [data-test-id]"
    ]
    
    print("Waiting for reviews to load...")
    
    for selector in review_selectors:
        try:
            print(f"Trying selector: {selector}")
            elements = wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, selector)))
            if elements:
                print(f"Found {len(elements)} elements with selector: {selector}")
                return selector, elements
        except TimeoutException:
            continue
    
    # If no specific selectors work, try a more general approach
    try:
        print("Trying general review detection...")
        # Look for any element that might contain review text
        general_elements = driver.find_elements(By.XPATH, "//*[contains(text(), 'star') or contains(text(), 'review') or contains(@class, 'review')]")
        if general_elements:
            print(f"Found {len(general_elements)} potential review elements")
            return "general", general_elements
    except:
        pass
    
    raise TimeoutException("Could not find any review elements")

def extract_reviews_with_multiple_methods(soup):
    """Try multiple methods to extract review data"""
    reviews_data = []
    
    # Method 1: Try the original selectors
    method1_containers = soup.select("[data-test-id='review-card']")
    if method1_containers:
        print(f"Method 1: Found {len(method1_containers)} review containers")
        for container in method1_containers:
            try:
                name_element = container.select_one("p.wt-text-caption.wt-text-truncate")
                text_element = container.select_one("p[id*='review-preview-toggle-']")
                rating_input = container.select_one("input[name='rating']")
                
                name = name_element.get_text(strip=True) if name_element else "N/A"
                review_text = text_element.get_text(strip=True) if text_element else "No review text."
                rating = rating_input['value'] if rating_input else "N/A"
                
                reviews_data.append({
                    "Reviewer Name": name,
                    "Rating (out of 5)": rating,
                    "Review": review_text
                })
            except Exception as e:
                print(f"Error extracting from container: {e}")
                continue
    
    # Method 2: Enhanced alternative selectors with better review detection
    if not reviews_data:
        print("Method 1 failed, trying enhanced review detection...")
        
        # Look for review-specific patterns in the HTML
        # Check for star ratings first
        star_elements = soup.find_all(['span', 'div'], class_=lambda x: x and ('star' in str(x).lower() or 'rating' in str(x).lower()))
        
        # Look for review text patterns
        review_text_patterns = [
            # Look for elements that might contain review text
            soup.find_all(['p', 'div'], string=lambda text: text and len(text) > 30 and any(word in text.lower() for word in ['love', 'perfect', 'beautiful', 'quality', 'recommend', 'bought', 'received', 'great', 'amazing', 'nice'])),
            # Look for elements with review-related classes
            soup.find_all(['div', 'p'], class_=lambda x: x and any(term in str(x).lower() for term in ['review', 'comment', 'feedback'])),
        ]
        
        potential_reviews = []
        for pattern_group in review_text_patterns:
            for element in pattern_group:
                text = element.get_text(strip=True)
                if 30 < len(text) < 1000:  # Reasonable review length
                    potential_reviews.append(text)
        
        # Remove duplicates while preserving order
        seen = set()
        unique_reviews = []
        for review in potential_reviews:
            if review not in seen:
                seen.add(review)
                unique_reviews.append(review)
        
        print(f"Found {len(unique_reviews)} potential reviews from enhanced detection")
        
        # Try to find associated names and ratings for these reviews
        for i, review_text in enumerate(unique_reviews[:15]):  # Limit to 15 reviews
            # Look for nearby elements that might contain names or ratings
            name = "N/A"
            rating = "N/A"
            
            # Try to find the element containing this review text
            review_element = soup.find(string=lambda text: text and review_text[:50] in text)
            if review_element:
                parent = review_element.parent
                # Look for name patterns near this review
                for sibling in parent.find_all_next(['span', 'p', 'div'], limit=10):
                    sibling_text = sibling.get_text(strip=True)
                    # Check if this might be a name (short, capitalized)
                    if (5 < len(sibling_text) < 50 and 
                        sibling_text[0].isupper() and 
                        not any(word in sibling_text.lower() for word in ['review', 'star', 'rating', 'the', 'and', 'this', 'item', 'product'])):
                        name = sibling_text
                        break
                
                # Look for star ratings near this review
                for sibling in parent.find_all_next(['span', 'div'], limit=10):
                    if sibling.get('aria-label') and 'star' in sibling.get('aria-label').lower():
                        rating_text = sibling.get('aria-label')
                        rating_match = re.search(r'(\d+)', rating_text)
                        if rating_match:
                            rating = rating_match.group(1)
                        break
            
            reviews_data.append({
                "Reviewer Name": name,
                "Rating (out of 5)": rating,
                "Review": review_text
            })
        
        if reviews_data:
            print(f"Successfully extracted {len(reviews_data)} reviews with enhanced method")
            return reviews_data
    
    # Method 3: Generic text extraction if all else fails
    if not reviews_data:
        print("All specific methods failed, trying generic text extraction...")
        all_text_elements = soup.find_all(['p', 'div'], string=True)
        potential_reviews = []
        
        for elem in all_text_elements:
            text = elem.get_text(strip=True)
            # Look for text that might be reviews (longer than 20 chars, contains common review words)
            if (len(text) > 20 and 
                any(word in text.lower() for word in ['love', 'great', 'perfect', 'beautiful', 'quality', 'recommend', 'nice', 'good', 'amazing'])):
                potential_reviews.append(text)
        
        for text in potential_reviews[:10]:  # Limit to first 10 potential reviews
            reviews_data.append({
                "Reviewer Name": "N/A",
                "Rating (out of 5)": "N/A", 
                "Review": text[:500] + "..." if len(text) > 500 else text
            })
    
    return reviews_data

def scrape_url(url, output_folder):
    print(f"--- Starting Scraper for URL: {url} ---")
    driver = setup_driver()
    html_content = ""
    
    try:
        print(f"Loading URL...")
        driver.get(url)
        time.sleep(random.uniform(3, 5))
        wait = WebDriverWait(driver, 20)
        
        scroll_to_reviews(driver)
        time.sleep(5)
        
        try:
            wait_for_reviews(driver, wait)
        except TimeoutException:
            print("Could not find reviews with wait strategy, proceeding with page source analysis...")
        
        html_content = driver.page_source
        
    except Exception as e:
        print(f"An error occurred during Selenium scraping: {e}")
        # Save HTML for debugging even on error
        debug_path = os.path.join(output_folder, f"error_page_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.html")
        with open(debug_path, "w", encoding="utf-8") as f:
            f.write(driver.page_source)
        print(f"Debug HTML saved to {debug_path}")
        return None
    finally:
        driver.quit()
    
    if not html_content:
        print("No HTML content was retrieved.")
        return None

    soup = BeautifulSoup(html_content, "html.parser")
    reviews_data = extract_reviews_with_multiple_methods(soup)
    
    if not reviews_data:
        print("❌ No reviews were extracted from the page.")
        return None
    
    print(f"--- ✅ Successfully extracted {len(reviews_data)} reviews ---")
    
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"scraped_reviews_{timestamp}.csv"
    output_path = os.path.join(output_folder, filename)
    
    fields = ["Reviewer Name", "Rating (out of 5)", "Review"]
    
    with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fields)
        writer.writeheader()
        writer.writerows(reviews_data)
    
    print(f"Scraped reviews saved to: {output_path}")
    return output_path
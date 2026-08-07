import os
import json
import requests
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Helper to find API Key
def get_api_key():
    # Read from environment
    key = os.getenv('VITE_GEMINI_API_KEY') or os.getenv('GEMINI_API_KEY')
    if not key:
        # Try manually reading .env in root directory
        try:
            root_env = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env')
            if os.path.exists(root_env):
                with open(root_env, 'r') as f:
                    for line in f:
                        if 'VITE_GEMINI_API_KEY' in line:
                            val = line.split('=', 1)[1].strip()
                            # Strip any quotes or comments
                            val = val.strip('"').strip("'")
                            return val
        except Exception:
            pass
    return key

def call_gemini(prompt, response_mime_type=None):
    api_key = get_api_key()
    if not api_key:
        print("Warning: Gemini API Key is missing.")
        return None

    # Use gemini-2.5-flash as it is fast and supports JSON schema / output
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    
    # Configure json output if requested
    generation_config = {}
    if response_mime_type == "application/json":
        generation_config["responseMimeType"] = "application/json"

    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": generation_config
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=60)
        if response.status_code == 200:
            res_data = response.json()
            text = res_data['candidates'][0]['content']['parts'][0]['text']
            return text
        else:
            print(f"Gemini API error ({response.status_code}): {response.text}")
            return None
    except Exception as e:
        print(f"Failed to connect to Gemini API: {str(e)}")
        return None

def generate_wellness_analysis(entries_list):
    """
    Sends the list of daily logs to Gemini and retrieves a structured JSON analysis.
    If Gemini fails, it invokes the data-driven fallback.
    """
    if not entries_list:
        return get_fallback_analysis([])

    # Format the data for Gemini
    formatted_entries = []
    for entry in entries_list:
        formatted_entries.append({
            "date": entry.get('date'),
            "sleep_hours": entry.get('sleep_hours'),
            "meals": entry.get('meals'),
            "water_intake": entry.get('water_intake'),
            "exercise_mins": entry.get('exercise_mins'),
            "mood": entry.get('mood'),
            "stress_level": entry.get('stress_level'),
            "study_hours": entry.get('study_hours'),
            "coding_hours": entry.get('coding_hours'),
            "screen_time": entry.get('screen_time')
        })

    prompt = f"""
    You are an AI health and productivity coach for university students. 
    Analyze the following recent daily habit logs of a student and generate a personalized report.

    Daily logs:
    {json.dumps(formatted_entries, indent=2)}

    Please return a JSON object with the exact keys below:
    - "health_analysis": Short summary of physical health based on sleep, exercise, and water intake.
    - "productivity_analysis": Evaluation of study hours, coding hours, and screen time balance.
    - "study_rec": Custom actionable recommendation for improving their study efficiency.
    - "sleep_rec": Actionable advice to improve sleep duration or consistency.
    - "food_suggestions": Diet and hydration coaching based on their logged meal quality and water.
    - "stress_advice": Direct recommendations to reduce stress levels.
    - "insights": A list of exactly 4 specific, data-backed insights showing correlations, formatted like:
      "You are most productive after 7+ hours of sleep." or "Your stress is highest when screen time exceeds 5 hours."
    - "weekly_scores": An object with score fields (numbers out of 100):
      "sleep_score", "health_score", "productivity_score", "study_score"

    Do not include any extra text outside the JSON. Return only the JSON object.
    """

    res_text = call_gemini(prompt, response_mime_type="application/json")
    if res_text:
        try:
            # Strip any markdown code fences if present
            cleaned_text = res_text.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
            return json.loads(cleaned_text.strip())
        except Exception as e:
            print(f"Error parsing Gemini response JSON: {str(e)}")
            
    return get_fallback_analysis(entries_list)

def generate_meal_suggestions(entries_list):
    """
    Recommends simple, student-friendly, affordable Indian vegetarian meals
    based on the student's sleep, study, and stress habits.
    """
    recent_entry = entries_list[-1] if entries_list else {}
    avg_sleep = sum(e.get('sleep_hours', 0.0) for e in entries_list) / max(len(entries_list), 1)
    avg_stress = sum(e.get('stress_level', 3) for e in entries_list) / max(len(entries_list), 1)

    prompt = f"""
    Based on the student's recent wellness metrics (Average sleep: {avg_sleep:.1f} hours, Average stress: {avg_stress:.1f}/5, Latest mood: {recent_entry.get('mood', '😐')}),
    recommend exactly 3 healthy, affordable, student-friendly Indian vegetarian meals.
    The meals should be easy to cook in a hostel/apartment with basic utensils.

    Return your response strictly as a JSON array of objects, where each object has these exact keys:
    - "meal_name": Name of the dish (e.g. Oats Khichdi, Paneer Bhurji)
    - "ingredients": A comma-separated string of cheap, local ingredients
    - "time_to_cook": Duration in minutes (e.g., "15 mins")
    - "why_it_helps": Short sentence explaining how it boosts mood, energy, or sleep

    Return only the JSON array. Do not include markdown code block syntax.
    """

    res_text = call_gemini(prompt, response_mime_type="application/json")
    if res_text:
        try:
            cleaned_text = res_text.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
            return json.loads(cleaned_text.strip())
        except Exception as e:
            print(f"Error parsing meals JSON: {str(e)}")

    # Fallback meal suggestions
    return [
        {
            "meal_name": "Moong Dal Khichdi",
            "ingredients": "Moong dal, rice, ghee, turmeric, ginger",
            "time_to_cook": "20 mins",
            "why_it_helps": "Extremely easy to digest, packed with clean protein, and perfect for stress recovery."
        },
        {
            "meal_name": "Scrambled Tofu / Paneer Bhurji",
            "ingredients": "Paneer or Tofu, onions, tomatoes, green chilies, coriander",
            "time_to_cook": "10 mins",
            "why_it_helps": "High protein to support long study hours and muscle recovery, keeping you full longer."
        },
        {
            "meal_name": "Masala Oats with Veggies",
            "ingredients": "Rolled oats, carrots, peas, onion, garam masala",
            "time_to_cook": "8 mins",
            "why_it_helps": "Rich in complex carbohydrates and fiber, keeping your brain energized without sugar crashes."
        }
    ]

def get_fallback_analysis(entries):
    """
    Computes a realistic, personalized wellness and productivity analysis
    by performing statistical analysis on the logged entries.
    """
    num_entries = len(entries)
    if num_entries == 0:
        return {
            "health_analysis": "No daily logs recorded yet. Start tracking your sleep, meals, and hydration to receive personalized health coaching.",
            "productivity_analysis": "No daily logs recorded yet. Log your study and coding sessions to see your focus patterns and productivity metrics.",
            "study_rec": "Establish a consistent daily study time and try the built-in Pomodoro timer to maintain focus.",
            "sleep_rec": "Aim for a regular bedtime (e.g., 10:30 PM) and target 7 to 8 hours of sleep tonight.",
            "food_suggestions": "Try to log your meals and drink at least 8-10 glasses (2.5L) of water daily.",
            "stress_advice": "High study loads should be balanced with short physical walks and screen-free breaks.",
            "insights": [
                "Track at least 3 days of logs to identify personal wellness correlations.",
                "Consistency in sleep timing builds a strong cognitive rhythm.",
                "Drink 2.5L+ of water to boost memory retention during exam prep.",
                "Coding performance peaks when combined with active study intervals."
            ],
            "weekly_scores": {
                "sleep_score": 0.0,
                "health_score": 0.0,
                "productivity_score": 0.0,
                "study_score": 0.0
            }
        }

    # Calculate averages
    avg_sleep = sum(e.get('sleep_hours', 0.0) for e in entries) / num_entries
    avg_study = sum(e.get('study_hours', 0.0) for e in entries) / num_entries
    avg_coding = sum(e.get('coding_hours', 0.0) for e in entries) / num_entries
    avg_water = sum(e.get('water_intake', 0.0) for e in entries) / num_entries
    avg_exercise = sum(e.get('exercise_mins', 0) for e in entries) / num_entries
    avg_stress = sum(e.get('stress_level', 3) for e in entries) / num_entries
    avg_screen = sum(e.get('screen_time', 0.0) for e in entries) / num_entries

    # Scores out of 100
    # Sleep Score: optimal is 7.5 - 9 hours
    sleep_score = max(0, min(100, 100 - abs(avg_sleep - 8.0) * 15))
    # Health Score: depends on water (target 2.5L), exercise (target 30m), mood
    health_score = min(100, (avg_water / 3.0) * 40 + (avg_exercise / 30) * 40 + (6 - avg_stress) * 4)
    # Productivity Score: study hours vs screen time balance
    productivity_score = min(100, (avg_study / 6.0) * 60 + max(0, (8 - avg_screen)) * 5)
    # Study Score: study + coding focus
    study_score = min(100, ((avg_study + avg_coding) / 8.0) * 100)

    # Dynamic Insights based on actual data
    insights = []
    
    # 1. Sleep -> Study
    if avg_sleep >= 7.0:
        insights.append(f"You sleep an average of {avg_sleep:.1f} hrs, which keeps your daily study focus high.")
    else:
        insights.append("Your average sleep is below 7 hours. Improving sleep will boost your focus during studies.")

    # 2. Water
    if avg_water >= 2.5:
        insights.append(f"Great job keeping hydrated! Your water intake averages a healthy {avg_water:.1f} liters.")
    else:
        insights.append("You drink less water on busy study days. Try keeping a bottle on your desk.")

    # 3. Stress & Screen Time
    if avg_screen > 6.0:
        insights.append(f"High screen time ({avg_screen:.1f}h) may be raising your average stress levels ({avg_stress:.1f}/5).")
    else:
        insights.append(f"Your screen time is well-balanced, keeping stress at a moderate {avg_stress:.1f}/5.")

    # 4. Exercise
    if avg_exercise >= 20:
        insights.append("Regular physical exercise is acting as an active mood booster and stress reliever.")
    else:
        insights.append("Adding a quick 15-minute morning walk will help elevate your overall energy levels.")

    # Generate narrative blocks based on metrics
    health_narrative = (
        f"Based on your last {num_entries} entries, your physical wellness is in a "
        f"{'healthy' if health_score >= 70 else 'moderate' if health_score >= 50 else 'recovering'} phase. "
        f"You average {avg_sleep:.1f} hours of sleep and {avg_water:.1f}L of water. "
        f"Increasing physical activity beyond {avg_exercise:.0f} mins will optimize your endurance."
    )

    prod_narrative = (
        f"You log about {avg_study:.1f} hours of academic study and {avg_coding:.1f} hours of coding per day. "
        f"Your productivity score is {productivity_score:.0f}/100. "
        f"Your screen time of {avg_screen:.1f} hours indicates a high digital exposure, suggesting frequent screen breaks."
    )

    study_rec = "Use the Pomodoro technique for coding blocks: 50 minutes of deep work followed by a 10-minute screen-free rest." if avg_study > 4 else "Set a structured slot in the morning for study to ensure daily academic progress."
    sleep_rec = "Maintain consistency by winding down 30 minutes before sleep. Turn off mobile devices to increase deep sleep cycle duration." if avg_sleep < 7 else "Your sleep hours are good! Keep maintaining this regular bedtime and waking schedule."
    food_suggestions = "Focus on nutrient-dense meals. Since water intake is slightly low, eat water-rich foods like cucumbers and oranges." if avg_water < 2.5 else "Your hydration is excellent. Continue incorporating protein-rich snacks during long study sessions."
    stress_advice = "Your stress level averages a score of {:.1f}/5. Practice deep breathing exercises for 5 minutes during periods of high study or coding loads.".format(avg_stress)

    return {
        "health_analysis": health_narrative,
        "productivity_analysis": prod_narrative,
        "study_rec": study_rec,
        "sleep_rec": sleep_rec,
        "food_suggestions": food_suggestions,
        "stress_advice": stress_advice,
        "insights": insights,
        "weekly_scores": {
            "sleep_score": round(sleep_score, 1),
            "health_score": round(health_score, 1),
            "productivity_score": round(productivity_score, 1),
            "study_score": round(study_score, 1)
        }
    }


def generate_product_recommendations(entries_list):
    """
    Formulates a prompt for Gemini model to recommend 4-8 student-friendly products
    based on their logs. If Gemini is unavailable, falls back to a clean local statistical engine.
    """
    if not entries_list:
        return get_fallback_product_recommendations([])

    # Summarize user stats
    num_entries = len(entries_list)
    avg_sleep = sum(e.get('sleep_hours', 0.0) for e in entries_list) / num_entries
    avg_study = sum(e.get('study_hours', 0.0) for e in entries_list) / num_entries
    avg_coding = sum(e.get('coding_hours', 0.0) for e in entries_list) / num_entries
    avg_water = sum(e.get('water_intake', 0.0) for e in entries_list) / num_entries
    avg_exercise = sum(e.get('exercise_mins', 0) for e in entries_list) / num_entries
    avg_stress = sum(e.get('stress_level', 3) for e in entries_list) / num_entries
    avg_screen = sum(e.get('screen_time', 0.0) for e in entries_list) / num_entries
    
    prompt = f"""
    You are an AI shopping advisor for college students.
    Analyze the following aggregated student wellness statistics (over {num_entries} days):
    - Average sleep hours: {avg_sleep:.1f} hours/day
    - Average water intake: {avg_water:.1f} liters/day
    - Average stress level: {avg_stress:.1f}/5
    - Average daily exercise: {avg_exercise:.1f} minutes/day
    - Average study time: {avg_study:.1f} hours/day
    - Average coding time: {avg_coding:.1f} hours/day
    - Average non-study screen time: {avg_screen:.1f} hours/day

    Based on these lifestyle metrics, recommend between 4 and 8 physical products that would genuinely improve the student's productivity, sleep, posture, workspace setup, hydration, or stress control.

    Select products from these categories:
    - Sleep Improvement
    - Study Essentials
    - Fitness
    - Nutrition
    - Eye Care
    - Productivity
    - Mental Wellness
    - Workspace Setup
    - Books
    - Healthy Snacks

    Assign a confidence indicator ("Highly Recommended", "Recommended", or "Optional") for each product based on how critical it is for their current habits. E.g. if their screen time is high, eye care products should be "Highly Recommended".

    Return your response strictly as a JSON object with a single root key "products" containing an array of objects. Each object must have these exact keys:
    - "name": Name of the product (be specific, e.g. "Contoured Memory Foam Sleep Mask")
    - "category": One of the exact categories listed above
    - "reason": A short sentence explaining why it is recommended based on their habits (e.g. "Recommended because your average sleep is under 6 hours.")
    - "estimated_price": A realistic estimated price in INR (e.g., "₹599")
    - "amazon_search": Direct search URL query (e.g., "https://www.amazon.in/s?k=Contoured+Memory+Foam+Sleep+Mask")
    - "flipkart_search": Direct search URL query (e.g., "https://www.flipkart.com/search?q=Contoured+Memory+Foam+Sleep+Mask")
    - "confidence": Confidence indicator level ("Highly Recommended", "Recommended", or "Optional")

    Return only the JSON object. Do not include markdown code block syntax or any introductory/explanatory text.
    """

    res_text = call_gemini(prompt, response_mime_type="application/json")
    if res_text:
        try:
            cleaned_text = res_text.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
            data = json.loads(cleaned_text.strip())
            if isinstance(data, dict) and "products" in data:
                return data["products"]
        except Exception as e:
            print(f"Error parsing recommendations JSON: {str(e)}")

    return get_fallback_product_recommendations(entries_list)


def get_fallback_product_recommendations(entries_list):
    """
    Pure python fallback recommender using student stats to recommend products
    """
    products = []
    
    if not entries_list:
        # Default student pack
        return [
            {
                "name": "Motivational Time-Marked Water Bottle (1L)",
                "category": "Nutrition",
                "reason": "Keeping a bottle on your desk encourages consistent hydration during long study blocks.",
                "estimated_price": "₹399",
                "amazon_search": "https://www.amazon.in/s?k=Motivational+Time+Marked+Water+Bottle+1L",
                "flipkart_search": "https://www.flipkart.com/search?q=Motivational+Time+Marked+Water+Bottle+1L",
                "confidence": "Highly Recommended"
            },
            {
                "name": "Blue Light Blocking Glasses",
                "category": "Eye Care",
                "reason": "Reduces screen glare and prevents eye fatigue during coding and research marathons.",
                "estimated_price": "₹799",
                "amazon_search": "https://www.amazon.in/s?k=Blue+Light+Blocking+Glasses",
                "flipkart_search": "https://www.flipkart.com/search?q=Blue+Light+Blocking+Glasses",
                "confidence": "Recommended"
            },
            {
                "name": "Physical Desktop Pomodoro Clock",
                "category": "Productivity",
                "reason": "Enforce study cycles without getting distracted by phone notifications.",
                "estimated_price": "₹650",
                "amazon_search": "https://www.amazon.in/s?k=Desktop+Pomodoro+Clock",
                "flipkart_search": "https://www.flipkart.com/search?q=Desktop+Pomodoro+Clock",
                "confidence": "Recommended"
            },
            {
                "name": "Organic Roasted Almonds & Cashews",
                "category": "Healthy Snacks",
                "reason": "A nutrient-rich source of healthy fats to boost concentration during exam prep.",
                "estimated_price": "₹450",
                "amazon_search": "https://www.amazon.in/s?k=Organic+Roasted+Almonds+and+Cashews",
                "flipkart_search": "https://www.flipkart.com/search?q=Organic+Roasted+Almonds+and+Cashews",
                "confidence": "Optional"
            }
        ]

    num_entries = len(entries_list)
    avg_sleep = sum(e.get('sleep_hours', 0.0) for e in entries_list) / num_entries
    avg_study = sum(e.get('study_hours', 0.0) for e in entries_list) / num_entries
    avg_coding = sum(e.get('coding_hours', 0.0) for e in entries_list) / num_entries
    avg_water = sum(e.get('water_intake', 0.0) for e in entries_list) / num_entries
    avg_exercise = sum(e.get('exercise_mins', 0) for e in entries_list) / num_entries
    avg_stress = sum(e.get('stress_level', 3) for e in entries_list) / num_entries
    avg_screen = sum(e.get('screen_time', 0.0) for e in entries_list) / num_entries

    # Sleep check
    if avg_sleep < 6.5:
        products.append({
            "name": "Contoured 3D Sleep Mask",
            "category": "Sleep Improvement",
            "reason": f"Your sleep has averaged {avg_sleep:.1f} hours. A contoured mask blocks light completely, helping you fall asleep faster.",
            "estimated_price": "₹499",
            "amazon_search": "https://www.amazon.in/s?k=Contoured+3D+Sleep+Mask",
            "flipkart_search": "https://www.flipkart.com/search?q=Contoured+3D+Sleep+Mask",
            "confidence": "Highly Recommended"
        })

    # Screen time
    if avg_screen > 5.0 or avg_coding > 4.0:
        products.append({
            "name": "Anti-Glare Blue Light Blocking Glasses",
            "category": "Eye Care",
            "reason": f"With high daily screen exposure ({avg_screen:.1f}h screen, {avg_coding:.1f}h coding), these glasses protect your eyes from digital strain.",
            "estimated_price": "₹799",
            "amazon_search": "https://www.amazon.in/s?k=Blue+Light+Blocking+Glasses",
            "flipkart_search": "https://www.flipkart.com/search?q=Blue+Light+Blocking+Glasses",
            "confidence": "Highly Recommended"
        })

    # Stress levels
    if avg_stress >= 3.5:
        products.append({
            "name": "Squeeze Therapy Stress Relief Balls",
            "category": "Mental Wellness",
            "reason": f"Your daily stress level averages {avg_stress:.1f}/5. Tensing and releasing focus balls helps relieve pent-up study pressure.",
            "estimated_price": "₹350",
            "amazon_search": "https://www.amazon.in/s?k=Stress+Relief+Squeeze+Balls",
            "flipkart_search": "https://www.flipkart.com/search?q=Stress+Relief+Squeeze+Balls",
            "confidence": "Highly Recommended"
        })

    # Sitting/workspace setup
    if avg_study + avg_coding > 6.0:
        products.append({
            "name": "Ergonomic Memory Foam Seat Cushion",
            "category": "Workspace Setup",
            "reason": f"You spend over {avg_study + avg_coding:.1f} hours daily sitting at your desk. Memory foam supports your lower back and coccyx.",
            "estimated_price": "₹1,299",
            "amazon_search": "https://www.amazon.in/s?k=Ergonomic+Memory+Foam+Seat+Cushion",
            "flipkart_search": "https://www.flipkart.com/search?q=Ergonomic+Memory+Foam+Seat+Cushion",
            "confidence": "Highly Recommended"
        })

    # Exercise / active
    if avg_exercise < 20:
        products.append({
            "name": "Heavy Duty Resistance Band Loop Set",
            "category": "Fitness",
            "reason": f"Your exercise levels are currently low ({avg_exercise:.0f} mins avg). Resistance bands allow quick strength exercises at your desk.",
            "estimated_price": "₹599",
            "amazon_search": "https://www.amazon.in/s?k=Resistance+Band+Set+Loop",
            "flipkart_search": "https://www.flipkart.com/search?q=Resistance+Band+Set+Loop",
            "confidence": "Recommended"
        })

    # Hydration
    if avg_water < 2.2:
        products.append({
            "name": "Motivational Time-Marked Water Bottle (1L)",
            "category": "Nutrition",
            "reason": f"Your hydration levels ({avg_water:.1f}L) are below recommendation. Time indicators prompt you to drink water regularly.",
            "estimated_price": "₹399",
            "amazon_search": "https://www.amazon.in/s?k=Motivational+Time+Marked+Water+Bottle+1L",
            "flipkart_search": "https://www.flipkart.com/search?q=Motivational+Time+Marked+Water+Bottle+1L",
            "confidence": "Highly Recommended"
        })

    # Always append general productivity tools to reach at least 4 items
    if len(products) < 4:
        products.append({
            "name": "Physical Desktop Pomodoro Clock",
            "category": "Productivity",
            "reason": "Enforce study cycles without getting distracted by phone notifications.",
            "estimated_price": "₹650",
            "amazon_search": "https://www.amazon.in/s?k=Desktop+Pomodoro+Clock",
            "flipkart_search": "https://www.flipkart.com/search?q=Desktop+Pomodoro+Clock",
            "confidence": "Recommended"
        })
    if len(products) < 4:
        products.append({
            "name": "Organic Roasted Almonds & Cashews",
            "category": "Healthy Snacks",
            "reason": "A nutrient-rich source of healthy fats to boost concentration during exam prep.",
            "estimated_price": "₹450",
            "amazon_search": "https://www.amazon.in/s?k=Organic+Roasted+Almonds+and+Cashews",
            "flipkart_search": "https://www.flipkart.com/search?q=Organic+Roasted+Almonds+and+Cashews",
            "confidence": "Optional"
        })
    if len(products) < 4:
        products.append({
            "name": "The 7 Habits of Highly Effective Teens / Students (Paperback)",
            "category": "Books",
            "reason": "A widely recommended self-help book that introduces prioritization habits and academic planning skills.",
            "estimated_price": "₹299",
            "amazon_search": "https://www.amazon.in/s?k=The+7+Habits+of+Highly+Effective+Teens+Students+book",
            "flipkart_search": "https://www.flipkart.com/search?q=The+7+Habits+of+Highly+Effective+Teens+Students+book",
            "confidence": "Optional"
        })

    return products[:8] # Limit recommendations between 4 and 8


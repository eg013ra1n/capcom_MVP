from flask import Flask, render_template, send_file, jsonify, Response
import requests, base64
from io import BytesIO
import json

app = Flask(__name__)

def fetch_weather_data():
    file_path = '/mnt/aagsolo/aag_json.dat'
    
    try:
        with open(file_path, 'r') as file:
            data = json.load(file)  # Загружаем JSON-данные из файла
            
            # Извлекаем и сохраняем данные о времени и статусе safe
            data_gmt_time = data.get('dataGMTTime', 'No Data')
            safe_status = data.get('safe', 0)
            
            # Удаление ненужных ключей перед возвратом данных
            data.pop('cwinfo', None)
            data.pop('slddata', None)
            
            return data, data_gmt_time, safe_status
    except Exception as e:
        print(f"Error accessing file: {e}")
        return {}, 'No Data', 0

def create_weather_table(data):
    if not data:
        return "<p>No weather data available.</p>"
    
    excluded_keys = ['slddata', 'cwinfo']
    filtered_data = {k: v for k, v in data.items() if k not in excluded_keys}
    table_html = '<table class="weather-table"><tr>'
    
    for key in filtered_data.keys():
        table_html += f'<th>{key}</th>'
    table_html += '</tr><tr>'
    
    for key, value in filtered_data.items():
        if isinstance(value, float) and key != 'dataGMTTime':
            value = f"{value:.2f}"  
        table_html += f'<td>{value}</td>'
    
    table_html += '</tr></table>'
    
    return table_html

@app.route('/weather-data')
def weather_data():
    weather_data, data_gmt_time, safe_status = fetch_weather_data()
    
    # Удаление ненужных ключей из словаря
    weather_data.pop('cwinfo', None)
    weather_data.pop('slddata', None)
    weather_data.pop('dataGMTTime', None)
    weather_data.pop('safe', None)
    # Возвращаем обновлённые данные в формате JSON
    return jsonify({
        'weather_data': weather_data,
        'data_gmt_time': data_gmt_time,
        'safe_status': safe_status
    })

# Функция для получения локального изображения
def get_local_image():
    local_image_path = '/tmp/indoor/last_image.jpg'  # Полный путь к локальному изображению ЗАПИХАТЬ В КОНФИГ
    return local_image_path

# Маршрут для отображения главной страницы
@app.route('/')
def index():
    return render_template('index.html')

# Маршрут для получения локального изображения
@app.route('/local_image')
def local_image():
    image_path = get_local_image()
    return send_file(image_path, mimetype='image/jpeg')

# Маршрут для получения удаленного изображения
@app.route('/remote_image')
def remote_image():
    image_url = 'https://asteroskopeion.buzmate.com/SPICA_OMEA_LAST_IMAGE_.jpg'
    response = requests.get(image_url)
    return send_file(BytesIO(response.content), mimetype='image/jpeg')

@app.route('/get_screenshot/<ip>')
def get_screenshot(ip):
    url = f'http://{ip}:1888/api/equipment'
    params = {'property': 'image', 'parameter': '50'}
    headers = {'Content-Type': 'application/json'}

    response = requests.get(url, headers=headers, params=params)
    
    response_json = response.json()

    if response_json["Success"]:
        return jsonify({"image": response_json["Response"]})
    else:
        return jsonify({"error": "Failed to get the image"}), 400

    
@app.route('/activate_imaging/<ip>', methods=['POST'])
def activate_imaging(ip):
    url = f'http://{ip}:1888/api/equipment'
    headers = {'Content-Type': 'application/json'}
    data = '{"Device": "application", "Action": "switch", "Parameter": ["imaging"]}'

    response = requests.post(url, headers=headers, data=data)
    response_json = response.json()

    if response_json["Success"]:
        return jsonify({"success": True})
    else:
        return jsonify({"error": "Failed to activate imaging"}), 400

@app.route('/get_image_history/<ip>')
def get_image_history(ip):
    url = f'http://{ip}:1888/api/history' #TODO запихать все в конфиги уже ну
    params = {'property': 'list', 'parameter': '-1'}
    headers = {'Content-Type': 'application/json'}

    response = requests.get(url, headers=headers, params=params)

    if response.status_code == 200:
        response_json = response.json()
        if response_json.get("Success"):
            # Возвращаем только данные, которые будут отображаться в таблице
            history_data = [{
                "TargetName": item["TargetName"],
                "DateTime": item["DateTime"],
                "Id": item["Id"],
                "Filter": item["Filter"],
                "Duration": item["Duration"],
                "Type": item["Type"],
                "Stars": item["Stars"],
                "HFR": round(item["HFR"], 3),  # Округление до 3 знаков после запятой
                "RmsText": item["RmsText"]
            } for item in response_json["Response"]]
            return jsonify(history_data)
        else:
            return jsonify({"error": "Failed to get image history"}), 400
    else:
        return jsonify({"error": "Failed to make request"}), response.status_code

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)

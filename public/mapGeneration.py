import geemap
import pandas as pd
import os
import ipywidgets as widgets
from ipyleaflet import Heatmap
from ipyleaflet import CircleMarker, LayerGroup
import folium
import sys
import json
from folium.plugins import HeatMap
from flask import Flask, request, jsonify

base_dir = os.path.dirname(os.path.abspath(__file__))

def getEmbassyLayer():
  embassyLocationsPD = pd.read_csv(os.path.join(base_dir, 'embassies.csv'))
  embassyLocations = []
  embassyMarkers = folium.FeatureGroup(name='Embassies')
    
  for _, row in embassyLocationsPD.iterrows():
    embassyLocation = {'location': (row['lat'],row['lon']), 'info': row['desc']}
    embassyLocations.append(embassyLocation)
    
  for embassy in embassyLocations:
    html = f"""
      <div style="
        font-family: Arial, sans-serif;
        color: #28A745;
        font-weight: bold;
        font-size: 14px;
        ">{embassy['info']}
      </div>"""
    popup = folium.Popup(html, max_width=200)
      
    marker = folium.Marker(
      location=embassy['location'],
      popup=popup,
      icon=folium.Icon(icon='landmark', prefix='fa', color='blue')
    )
    marker.add_to(embassyMarkers)
  
  return embassyMarkers


def getBunkerLayer():
  bunkerLocationsPD = pd.read_csv(os.path.join(base_dir, 'bunkers.csv'))
  bunkerLocations = []
  bunkerMarkers = folium.FeatureGroup(name='Bunkers')
    
  for _, row in bunkerLocationsPD.iterrows():
    bunkerLocation = {'location': (row['lat'],row['lon']), 'info': row['type']}
    bunkerLocations.append(bunkerLocation)
    
  for bunker in bunkerLocations:
    html = f"""
      <div style="
        font-family: Arial, sans-serif;
        color: #28A745;
        font-weight: bold;
        font-size: 14px;
        ">{bunker['info']}
      </div>"""
    popup = folium.Popup(html, max_width=200)
      
    marker = folium.Marker(
      location=bunker['location'],
      popup=popup,
      icon=folium.Icon(icon='shield-heart', prefix='fa', color='green')
    )
    marker.add_to(bunkerMarkers)
  
  return bunkerMarkers


def getHeatLayer():
  heatLocationsPD = pd.read_csv(os.path.join(base_dir, 'heat.csv'))
  heatLocations = []
    
  for _, row in heatLocationsPD.iterrows():
    heatLocations.append([row['lat'],row['lon'],row['ins']])

  heatMarkers = folium.FeatureGroup(name='Heatmap')
  HeatMap(heatLocations, radius=25, blur=25).add_to(heatMarkers)
  return heatMarkers


def getAttackLayer():
  attackLocationsPD = pd.read_csv(os.path.join(base_dir, 'heat.csv'))
  attackLocations = []
  attackMarkers = folium.FeatureGroup(name='Attacks')

  for _, row in attackLocationsPD.iterrows():
    attackLocation = {'location': (row['lat'],row['lon']), 'info': row['type']}
    attackLocations.append(attackLocation)
    
  for attack in attackLocations:
    html = f"""
      <div style="
        font-family: Arial, sans-serif;
        color: #b22222;
        font-weight: bold;
        font-size: 14px;
        ">{attack['info']}
      </div>"""
      
    popup = folium.Popup(html, max_width=200)

    marker = folium.Marker(
      location=attack['location'],
      popup=popup,
      icon=folium.Icon(icon='skull-crossbones', prefix='fa', color='red')
    )
    marker.add_to(attackMarkers)
  
  return attackMarkers

    
def addBunker(latitute, longitute, info):
  bunkerLocationPD = pd.read_csv(os.path.join(base_dir, 'bunkers.csv'))
  newBunkerLocation = {'lat': latitute, 'lon': longitute, 'desc': info}
  bunkerLocationPD = pd.concat([bunkerLocationPD, pd.DataFrame([newBunkerLocation])], ignore_index=True)
  bunkerLocationPD.to_csv('bunkers.csv', index=False)


def addHeat(latitute, longitute, intensity, info):
  heatLocationPD = pd.read_csv(os.path.join(base_dir, 'heat.csv'))
  newHeatLocation = {'lat': latitute, 'lon': longitute, 'ins': intensity, 'type': info}
  heatLocationPD = pd.concat([heatLocationPD, pd.DataFrame([newHeatLocation])], ignore_index=True)
  heatLocationPD.to_csv('heat.csv', index=False)


#app = Flask(__name__)
#def getUpdatedMap():  
#  layers = request.get_json()
#  
#  Map = folium.Map(location=[32, 35], zoom_start=10)
#  folium.TileLayer(
#    tiles='https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
#    attr='Esri',
#    name='Esri WorldTopoMap',
#    overlay=False,
#    control=True
#  ).add_to(Map)
#  
#
#  bunkerLayer = getBunkerLayer()
#  
#  heatLayer = getHeatLayer()
#  attackLayer = getAttackLayer()
#  embassyLayer = getEmbassyLayer()
#  Map.add_child(bunkerLayer)
#  Map.add_child(heatLayer)
#  Map.add_child(attackLayer)
#  Map.add_child(embassyLayer)
#
#  Map.save(os.path.join(base_dir, 'map-new.html'))
#  return jsonify({"status": "success", "received": len(layers)})

if __name__ == '__main__':
  input_text = sys.stdin.read()
  layers = json.loads(input_text)

  Map = folium.Map(location=[32, 35], zoom_start=10)
  folium.TileLayer(
    tiles='https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attr='Esri',
    name='Esri WorldTopoMap',
    overlay=False,
    control=True
    ).add_to(Map)

  for layer in layers:
    if layer['name'] == 'Embassy Locations' and layer.get('checked'):
      Map.add_child(getEmbassyLayer())
    elif layer['name'] == 'Safe Places' and layer.get('checked'):
      Map.add_child(getBunkerLayer())
    elif layer['name'] == 'Danger Zones' and layer.get('checked'):
      Map.add_child(getHeatLayer())
    elif layer['name'] == 'Attack Locations' and layer.get('checked'):
      Map.add_child(getAttackLayer())

  Map.save(os.path.join(base_dir, 'map.html'))
  print(json.dumps({"status":"success","received":len(layers)}))
  sys.exit(0)
/**
 * LocationPicker — Selección de ubicación en mapa interactivo
 * Proveedor usa esto para marcar la ubicación exacta de su negocio.
 * Funciona en web (iframe Leaflet) y nativo (WebView Leaflet).
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/lib/constants';

export interface PickedLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

interface Props {
  visible: boolean;
  initial?: PickedLocation;
  onConfirm: (loc: PickedLocation) => void;
  onClose: () => void;
}

function buildMapHtml(lat: number, lon: number): string {
  return `<!DOCTYPE html><html><head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body,#map{width:100%;height:100%}
    #toast{position:absolute;bottom:80px;left:50%;transform:translateX(-50%);
      background:rgba(15,23,42,0.88);color:#fff;padding:10px 16px;
      border-radius:999px;font-size:13px;font-weight:700;z-index:999;
      white-space:nowrap;pointer-events:none;transition:opacity 0.3s}
    #confirm{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);
      background:#0f766e;color:#fff;padding:12px 28px;border-radius:14px;
      font-size:15px;font-weight:800;z-index:999;border:none;cursor:pointer;
      box-shadow:0 4px 14px rgba(15,118,110,0.35)}
  </style>
</head><body>
  <div id="map"></div>
  <div id="toast">Toca para marcar la ubicación de tu negocio</div>
  <button id="confirm" onclick="sendConfirm()">Confirmar ubicación</button>
  <script>
    var initLat = ${lat || 17.64};
    var initLon = ${lon || -101.55};
    var map = L.map('map').setView([initLat, initLon], ${lat ? 15 : 10});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
      attribution:'© OpenStreetMap',maxZoom:19
    }).addTo(map);

    var marker = null;
    var pickedLat = ${lat || 0};
    var pickedLon = ${lon || 0};
    ${lat ? `marker = L.marker([${lat},${lon}],{draggable:true}).addTo(map);
      marker.on('dragend',function(e){
        pickedLat = e.target.getLatLng().lat;
        pickedLon = e.target.getLatLng().lng;
        updateToast();
      });` : ''}

    function updateToast(){
      document.getElementById('toast').textContent =
        pickedLat.toFixed(5) + '° N, ' + Math.abs(pickedLon).toFixed(5) + '° O — Arrastrar para ajustar';
    }
    ${lat ? 'updateToast();' : ''}

    map.on('click', function(e){
      pickedLat = e.latlng.lat;
      pickedLon = e.latlng.lng;
      if(marker) map.removeLayer(marker);
      marker = L.marker([pickedLat,pickedLon],{draggable:true}).addTo(map);
      marker.on('dragend',function(ev){
        pickedLat = ev.target.getLatLng().lat;
        pickedLon = ev.target.getLatLng().lng;
        updateToast();
      });
      updateToast();
      postLoc();
    });

    function postLoc(){
      var msg = JSON.stringify({type:'pick',lat:pickedLat,lon:pickedLon});
      if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(msg);
      else window.parent.postMessage(msg,'*');
    }
    function sendConfirm(){
      if(!pickedLat && !pickedLon){ alert('Toca el mapa primero.'); return; }
      var msg = JSON.stringify({type:'confirm',lat:pickedLat,lon:pickedLon});
      if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(msg);
      else window.parent.postMessage(msg,'*');
    }
  </script>
</body></html>`;
}

export function LocationPicker({ visible, initial, onConfirm, onClose }: Props) {
  const [pending, setPending] = useState<PickedLocation | null>(null);
  const lat = initial?.latitude ?? 0;
  const lon = initial?.longitude ?? 0;
  const html = buildMapHtml(lat, lon);

  const handleMessage = (raw: string) => {
    try {
      const msg = JSON.parse(raw);
      if (msg.type === 'pick') {
        setPending({ latitude: msg.lat, longitude: msg.lon });
      } else if (msg.type === 'confirm') {
        onConfirm({ latitude: msg.lat, longitude: msg.lon });
        onClose();
      }
    } catch {}
  };

  if (!visible) return null;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingBottom: 8 }}>
          <View>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900' }}>Ubicación del negocio</Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 }}>
              {pending ? `${pending.latitude.toFixed(5)}° N · ${Math.abs(pending.longitude).toFixed(5)}° O` : 'Toca el mapa para marcar'}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose}
            style={{ width: 36, height: 36, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {Platform.OS === 'web' ? (
          <iframe
            srcDoc={html}
            style={{ flex: 1, border: 'none', width: '100%', height: '100%' } as any}
            sandbox="allow-scripts allow-same-origin"
            onLoad={(e: any) => {
              try {
                const win = e.target.contentWindow;
                win.addEventListener('message', (ev: any) => handleMessage(ev.data));
              } catch {}
            }}
          />
        ) : (
          (() => {
            try {
              const { WebView } = require('react-native-webview');
              return (
                <WebView
                  source={{ html }}
                  style={{ flex: 1 }}
                  javaScriptEnabled
                  domStorageEnabled
                  originWhitelist={['*']}
                  mixedContentMode="always"
                  onMessage={(e: any) => handleMessage(e.nativeEvent.data)}
                />
              );
            } catch {
              return (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff' }}>WebView no disponible. Ingresa coordenadas manualmente.</Text>
                </View>
              );
            }
          })()
        )}
      </SafeAreaView>
    </Modal>
  );
}

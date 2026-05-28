import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';

// 波特率选项
const BAUD_RATES = [9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600, 1000000, 2000000];
const DATA_BITS = [5, 6, 7, 8];
const STOP_BITS = [1, 2];
const PARITY_OPTIONS = [
  { value: 'none', label: '无' },
  { value: 'odd', label: '奇校验' },
  { value: 'even', label: '偶校验' },
];

function App() {
  // 串口配置
  const [ports, setPorts] = useState<string[]>([]);
  const [selectedPort, setSelectedPort] = useState('');
  const [baudRate, setBaudRate] = useState(115200);
  const [dataBits, setDataBits] = useState(8);
  const [stopBits, setStopBits] = useState(1);
  const [parity, setParity] = useState('none');
  const [isOpen, setIsOpen] = useState(false);

  // 数据收发
  const [receiveData, setReceiveData] = useState('');
  const [sendData, setSendData] = useState('');
  const [receiveHexMode, setReceiveHexMode] = useState(false);
  const [sendHexMode, setSendHexMode] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  // 状态
  const [status, setStatus] = useState('就绪');
  const receiveRef = useRef<HTMLTextAreaElement>(null);
  const pollInterval = useRef<number | null>(null);

  // 扫描串口
  const scanPorts = async () => {
    try {
      const availablePorts = await invoke<string[]>('get_available_ports');
      setPorts(availablePorts);
      if (availablePorts.length > 0 && !selectedPort) {
        setSelectedPort(availablePorts[0]);
      }
    } catch (error) {
      console.error('扫描串口失败:', error);
      setStatus('扫描串口失败');
    }
  };

  // 打开串口
  const openPort = async () => {
    if (!selectedPort) {
      setStatus('请选择串口');
      return;
    }
    try {
      await invoke('open_serial_port', {
        portName: selectedPort,
        baudRate: baudRate,
        dataBits: dataBits,
        stopBits: stopBits,
        parity: parity,
      });
      setIsOpen(true);
      setStatus(`已打开 ${selectedPort} @ ${baudRate}`);
    } catch (error) {
      console.error('打开串口失败:', error);
      setStatus(`打开失败: ${error}`);
    }
  };

  // 关闭串口
  const closePort = async () => {
    try {
      await invoke('close_serial_port', { portName: selectedPort });
      setIsOpen(false);
      setStatus('已关闭');
    } catch (error) {
      console.error('关闭串口失败:', error);
    }
  };

  // 发送数据
  const sendSerialData = async () => {
    if (!isOpen) {
      setStatus('请先打开串口');
      return;
    }
    try {
      let data: number[];
      if (sendHexMode) {
        // 十六进制模式
        const hexStr = sendData.replace(/\s/g, '');
        data = [];
        for (let i = 0; i < hexStr.length; i += 2) {
          data.push(parseInt(hexStr.substr(i, 2), 16));
        }
      } else {
        // 文本模式
        data = Array.from(new TextEncoder().encode(sendData));
      }
      await invoke('write_serial_data', { portName: selectedPort, data });
      setStatus(`已发送 ${data.length} 字节`);
    } catch (error) {
      console.error('发送失败:', error);
      setStatus(`发送失败: ${error}`);
    }
  };

  // 读取数据
  const readSerialData = async () => {
    if (!isOpen) return;
    try {
      const data = await invoke<number[]>('read_serial_data', { portName: selectedPort });
      if (data.length > 0) {
        let text: string;
        if (receiveHexMode) {
          // 十六进制显示
          text = data.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ') + ' ';
        } else {
          // 文本显示
          text = new TextDecoder().decode(new Uint8Array(data));
        }
        setReceiveData(prev => prev + text);
      }
    } catch (error) {
      console.error('读取失败:', error);
    }
  };

  // 自动滚动
  useEffect(() => {
    if (autoScroll && receiveRef.current) {
      receiveRef.current.scrollTop = receiveRef.current.scrollHeight;
    }
  }, [receiveData, autoScroll]);

  // 轮询读取数据
  useEffect(() => {
    if (isOpen) {
      pollInterval.current = window.setInterval(readSerialData, 50);
    } else {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    }
    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, [isOpen, receiveHexMode]);

  // 初始化扫描
  useEffect(() => {
    scanPorts();
  }, []);

  // 清空接收
  const clearReceive = () => setReceiveData('');
  // 清空发送
  const clearSend = () => setSendData('');

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-gray-200 p-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-[#e94560]">串口调试工具</h1>
        <div className="text-sm text-gray-400">状态: {status}</div>
      </div>

      {/* 配置区域 */}
      <div className="bg-[#16213e] rounded-lg p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {/* 串口选择 */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">串口</label>
            <div className="flex gap-2">
              <select
                value={selectedPort}
                onChange={(e) => setSelectedPort(e.target.value)}
                disabled={isOpen}
                className="flex-1 bg-[#0f3460] border border-[#0f3460] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#e94560]"
              >
                {ports.map(port => (
                  <option key={port} value={port}>{port}</option>
                ))}
                {ports.length === 0 && <option value="">无可用串口</option>}
              </select>
              <button
                onClick={scanPorts}
                disabled={isOpen}
                className="px-3 py-2 bg-[#0f3460] hover:bg-[#e94560] rounded text-sm transition-colors"
                title="刷新串口列表"
              >
                🔄
              </button>
            </div>
          </div>

          {/* 波特率 */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">波特率</label>
            <select
              value={baudRate}
              onChange={(e) => setBaudRate(Number(e.target.value))}
              disabled={isOpen}
              className="w-full bg-[#0f3460] border border-[#0f3460] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#e94560]"
            >
              {BAUD_RATES.map(rate => (
                <option key={rate} value={rate}>{rate.toLocaleString()}</option>
              ))}
            </select>
          </div>

          {/* 数据位 */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">数据位</label>
            <select
              value={dataBits}
              onChange={(e) => setDataBits(Number(e.target.value))}
              disabled={isOpen}
              className="w-full bg-[#0f3460] border border-[#0f3460] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#e94560]"
            >
              {DATA_BITS.map(bits => (
                <option key={bits} value={bits}>{bits}</option>
              ))}
            </select>
          </div>

          {/* 停止位 */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">停止位</label>
            <select
              value={stopBits}
              onChange={(e) => setStopBits(Number(e.target.value))}
              disabled={isOpen}
              className="w-full bg-[#0f3460] border border-[#0f3460] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#e94560]"
            >
              {STOP_BITS.map(bits => (
                <option key={bits} value={bits}>{bits}</option>
              ))}
            </select>
          </div>

          {/* 校验位 */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">校验位</label>
            <select
              value={parity}
              onChange={(e) => setParity(e.target.value)}
              disabled={isOpen}
              className="w-full bg-[#0f3460] border border-[#0f3460] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#e94560]"
            >
              {PARITY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* 打开/关闭按钮 */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">操作</label>
            <button
              onClick={isOpen ? closePort : openPort}
              className={`w-full py-2 rounded font-medium transition-colors ${
                isOpen
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isOpen ? '关闭串口' : '打开串口'}
            </button>
          </div>
        </div>
      </div>

      {/* 数据接收区域 */}
      <div className="bg-[#16213e] rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-[#e94560]">数据接收</h2>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={receiveHexMode}
                onChange={(e) => setReceiveHexMode(e.target.checked)}
                className="accent-[#e94560]"
              />
              十六进制显示
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="accent-[#e94560]"
              />
              自动滚动
            </label>
            <button
              onClick={clearReceive}
              className="px-3 py-1 bg-[#0f3460] hover:bg-[#e94560] rounded text-sm transition-colors"
            >
              清空接收
            </button>
          </div>
        </div>
        <textarea
          ref={receiveRef}
          value={receiveData}
          readOnly
          className="receive-area w-full h-64 bg-[#0f3460] border border-[#0f3460] rounded p-3 resize-none focus:outline-none"
        />
      </div>

      {/* 数据发送区域 */}
      <div className="bg-[#16213e] rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-[#e94560]">数据发送</h2>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={sendHexMode}
                onChange={(e) => setSendHexMode(e.target.checked)}
                className="accent-[#e94560]"
              />
              十六进制发送
            </label>
            <button
              onClick={clearSend}
              className="px-3 py-1 bg-[#0f3460] hover:bg-[#e94560] rounded text-sm transition-colors"
            >
              清空发送
            </button>
            <button
              onClick={sendSerialData}
              disabled={!isOpen}
              className="px-4 py-1 bg-[#e94560] hover:bg-[#ff6b6b] disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
            >
              发送数据
            </button>
          </div>
        </div>
        <textarea
          value={sendData}
          onChange={(e) => setSendData(e.target.value)}
          placeholder={sendHexMode ? "输入十六进制数据，如: 48 65 6C 6C 6F" : "输入要发送的文本..."}
          className="send-area w-full h-24 bg-[#0f3460] border border-[#0f3460] rounded p-3 resize-none focus:outline-none focus:border-[#e94560]"
        />
      </div>

      {/* 底部信息 */}
      <div className="mt-4 text-center text-xs text-gray-500">
        支持波特率: 9600 ~ 2000000 (2M) | 基于 Tauri + React + TypeScript 构建
      </div>
    </div>
  );
}

export default App;

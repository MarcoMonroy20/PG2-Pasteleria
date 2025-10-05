import { Alert } from 'react-native';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  data?: any;
}

class VisualLogger {
  private static logs: LogEntry[] = [];
  private static maxLogs = 50;

  static log(message: string, data?: any) {
    this.addLog('info', message, data);
  }

  static success(message: string, data?: any) {
    this.addLog('success', message, data);
  }

  static warning(message: string, data?: any) {
    this.addLog('warning', message, data);
  }

  static error(message: string, data?: any) {
    this.addLog('error', message, data);
  }

  private static addLog(level: LogEntry['level'], message: string, data?: any) {
    const logEntry: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      data,
    };

    this.logs.unshift(logEntry);
    
    // Mantener solo los últimos logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Mostrar alertas para errores críticos
    if (level === 'error' && message.includes('[ANDROID]')) {
      setTimeout(() => {
        Alert.alert(
          'Error Android',
          message,
          [{ text: 'OK' }]
        );
      }, 100);
    }
  }

  static getLogs(): LogEntry[] {
    return this.logs;
  }

  static clearLogs() {
    this.logs = [];
  }

  static showLogs() {
    const recentLogs = this.logs.slice(0, 10);
    const logText = recentLogs.map(log => 
      `${log.timestamp} [${log.level.toUpperCase()}] ${log.message}`
    ).join('\n');

    Alert.alert(
      'Logs Recientes',
      logText || 'No hay logs disponibles',
      [{ text: 'OK' }]
    );
  }
}

export default VisualLogger;

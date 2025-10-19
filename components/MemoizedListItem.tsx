import React, { memo, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Pedido } from '../services/db';
import Colors from '../constants/Colors';
const formatearPrecio = (n: number) => `Q${(n || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
import { useAccessibility } from '../hooks/useAccessibility';

interface MemoizedPedidoItemProps {
  pedido: Pedido;
  onPress: () => void;
  onAbonar?: () => void;
  onEditar?: () => void;
  onEliminar?: () => void;
  showActions?: boolean;
  index?: number;
}

// Componente memoizado para elementos de pedido
const MemoizedPedidoItem = memo<MemoizedPedidoItemProps>(({
  pedido,
  onPress,
  onAbonar,
  onEditar,
  onEliminar,
  showActions = false,
  index = 0,
}) => {
  const { screenReaderEnabled } = useAccessibility();

  // Memoizar cálculos costosos
  const fechaFormateada = useMemo(() => {
    const date = new Date(pedido.fecha_entrega);
    const hoy = new Date();
    const mañana = new Date();
    mañana.setDate(hoy.getDate() + 1);

    const esHoy = date.toDateString() === hoy.toDateString();
    const esMañana = date.toDateString() === mañana.toDateString();

    if (esHoy) return 'HOY';
    if (esMañana) return 'MAÑANA';
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }, [pedido.fecha_entrega]);

  const productosResumen = useMemo(() => {
    const productos = pedido.productos || [];
    if (productos.length === 0) return 'Sin productos';

    const tipos = productos.reduce((acc, prod) => {
      const tipo = prod.tipo || 'otro';
      acc[tipo] = (acc[tipo] || 0) + (prod.cantidad || 1);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(tipos)
      .map(([tipo, cantidad]) => `${cantidad}x ${tipo}`)
      .join(', ');
  }, [pedido.productos]);

  const estadoPago = useMemo(() => {
    const total = pedido.precio_final;
    const abonado = pedido.monto_abonado || 0;
    if (abonado === 0) return 'pendiente';
    if (abonado >= total) return 'completo';
    return 'parcial';
  }, [pedido.precio_final, pedido.monto_abonado]);

  const pendiente = useMemo(() => {
    return Math.max(0, pedido.precio_final - (pedido.monto_abonado || 0));
  }, [pedido.precio_final, pedido.monto_abonado]);

  // Etiqueta de accesibilidad optimizada
  const accessibilityLabel = useMemo(() => {
    const status = estadoPago === 'pendiente' ? 'sin abonos' :
                   estadoPago === 'parcial' ? 'abono parcial' : 'pagado completo';
    return `Pedido ${pedido.nombre}, fecha ${fechaFormateada}, total ${formatearPrecio(pedido.precio_final)}, ${status}, ${productosResumen}`;
  }, [pedido.nombre, fechaFormateada, pedido.precio_final, estadoPago, productosResumen]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Toca para ver detalles del pedido"
      accessibilityRole="button"
      importantForAccessibility="yes"
    >
      <View style={styles.header}>
        <Text style={styles.nombre} numberOfLines={1}>
          {pedido.nombre}
        </Text>
        <Text style={styles.fecha}>
          {fechaFormateada}
        </Text>
      </View>

      <View style={styles.detalles}>
        <View style={styles.montos}>
          <Text style={styles.total}>
            Total: {formatearPrecio(pedido.precio_final)}
          </Text>
          {pedido.monto_abonado > 0 && (
            <Text style={styles.abonado}>
              Abonado: {formatearPrecio(pedido.monto_abonado)}
            </Text>
          )}
          {pendiente > 0 && (
            <Text style={[styles.pendiente, styles.pendienteText]}>
              Debe: {formatearPrecio(pendiente)}
            </Text>
          )}
        </View>

        <View style={styles.estadoContainer}>
          <View style={[
            styles.estadoBadge,
            estadoPago === 'completo' && styles.estadoCompleto,
            estadoPago === 'parcial' && styles.estadoParcial,
            estadoPago === 'pendiente' && styles.estadoPendiente,
          ]}>
            <Text style={[
              styles.estadoText,
              estadoPago === 'completo' && styles.estadoTextCompleto,
            ]}>
              {estadoPago === 'completo' ? '✓ Pagado' :
               estadoPago === 'parcial' ? '~ Parcial' : '✗ Pendiente'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.productosContainer}>
        <Text style={styles.productosText} numberOfLines={2}>
          {productosResumen}
        </Text>
      </View>

      {pedido.descripcion && (
        <Text style={styles.descripcion} numberOfLines={2}>
          {pedido.descripcion}
        </Text>
      )}

      {showActions && (
        <View style={styles.actions}>
          {onAbonar && pendiente > 0 && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.abonarBtn]}
              onPress={onAbonar}
              accessibilityLabel={`Abonar a pedido ${pedido.nombre}`}
              accessibilityHint="Agregar pago al pedido"
            >
              <Text style={styles.actionBtnText}>💰 Abonar</Text>
            </TouchableOpacity>
          )}
          {onEditar && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.editarBtn]}
              onPress={onEditar}
              accessibilityLabel={`Editar pedido ${pedido.nombre}`}
              accessibilityHint="Modificar detalles del pedido"
            >
              <Text style={styles.actionBtnText}>✏️ Editar</Text>
            </TouchableOpacity>
          )}
          {onEliminar && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.eliminarBtn]}
              onPress={onEliminar}
              accessibilityLabel={`Eliminar pedido ${pedido.nombre}`}
              accessibilityHint="Borrar este pedido"
            >
              <Text style={styles.actionBtnText}>🗑️ Eliminar</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
});

MemoizedPedidoItem.displayName = 'MemoizedPedidoItem';

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
    shadowColor: Colors.light.buttonSecondary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.titleColor,
    flex: 1,
  },
  fecha: {
    fontSize: 12,
    color: Colors.light.buttonPrimary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  detalles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  montos: {
    flex: 1,
  },
  total: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.titleColor,
  },
  abonado: {
    fontSize: 14,
    color: Colors.light.buttonSecondary,
  },
  pendiente: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  pendienteText: {
    color: '#DC3545',
  },
  estadoContainer: {
    alignItems: 'flex-end',
  },
  estadoBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#DC3545',
  },
  estadoCompleto: {
    backgroundColor: '#28A745',
  },
  estadoParcial: {
    backgroundColor: '#FFC107',
  },
  estadoPendiente: {
    backgroundColor: '#DC3545',
  },
  estadoText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  estadoTextCompleto: {
    color: '#FFFFFF',
  },
  productosContainer: {
    marginBottom: 4,
  },
  productosText: {
    fontSize: 14,
    color: Colors.light.inputText,
    fontStyle: 'italic',
  },
  descripcion: {
    fontSize: 14,
    color: Colors.light.inputText,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.inputBorder,
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  abonarBtn: {
    backgroundColor: '#28A745',
  },
  editarBtn: {
    backgroundColor: Colors.light.buttonSecondary,
  },
  eliminarBtn: {
    backgroundColor: '#DC3545',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default MemoizedPedidoItem;

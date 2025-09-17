import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import Colors from '../../constants/Colors';
import { initDB, obtenerPedidos, Pedido } from '../../services/db';

export default function EstadisticasScreen() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    try {
      await initDB();
      const data = await obtenerPedidos();
      setPedidos(data);
    } catch (e) {
      // noop
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargar();
    setRefreshing(false);
  };

  const stats = useMemo(() => {
    const total = pedidos.length;
    const totalPrecio = pedidos.reduce((acc, p) => acc + (Number(p.precio_final) || 0), 0);
    const totalAbonado = pedidos.reduce((acc, p) => acc + (Number(p.monto_abonado) || 0), 0);
    const totalDebe = totalPrecio - totalAbonado;

    // Por mes (YYYY-MM)
    const porMesMap: Record<string, { count: number; total: number }> = {};
    pedidos.forEach(p => {
      const key = (p.fecha_entrega || '').slice(0, 7);
      if (!porMesMap[key]) porMesMap[key] = { count: 0, total: 0 };
      porMesMap[key].count += 1;
      porMesMap[key].total += Number(p.precio_final) || 0;
    });
    const porMes = Object.entries(porMesMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, v]) => ({ mes, cantidad: v.count, total: v.total }));

    return { total, totalPrecio, totalAbonado, totalDebe, porMes };
  }, [pedidos]);

  const f = (n: number) => `Q${n.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Estadísticas</Text>

      <View style={styles.cardsRow}>
        <View style={styles.card}><Text style={styles.cardLabel}>Pedidos</Text><Text style={styles.cardValue}>{stats.total}</Text></View>
        <View style={styles.card}><Text style={styles.cardLabel}>Total</Text><Text style={styles.cardValue}>{f(stats.totalPrecio)}</Text></View>
      </View>
      <View style={styles.cardsRow}>
        <View style={styles.card}><Text style={styles.cardLabel}>Abonado</Text><Text style={styles.cardValue}>{f(stats.totalAbonado)}</Text></View>
        <View style={styles.card}><Text style={[styles.cardLabel, styles.pendiente]}>Debe</Text><Text style={[styles.cardValue, styles.pendiente]}>{f(stats.totalDebe)}</Text></View>
      </View>

      <Text style={styles.subTitle}>Por mes</Text>
      <FlatList
        data={stats.porMes}
        keyExtractor={(it) => it.mes}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={styles.rowItem}>
            <Text style={styles.rowMes}>{new Date(item.mes + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</Text>
            <Text style={styles.rowCant}>{item.cantidad}</Text>
            <Text style={styles.rowTotal}>{f(item.total)}</Text>
          </View>
        )}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Aún no hay pedidos</Text> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background, padding: 16, paddingTop: 50 },
  title: {
    fontSize: 24, fontWeight: 'bold', marginBottom: 12, color: Colors.light.titleColor,
  },
  subTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.light.titleColor, marginTop: 8, marginBottom: 8 },
  cardsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  card: { flex: 1, backgroundColor: Colors.light.cardBackground, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: Colors.light.inputBorder },
  cardLabel: { color: Colors.light.inputText, fontWeight: '600', marginBottom: 4 },
  cardValue: { color: Colors.light.titleColor, fontWeight: 'bold', fontSize: 18 },
  pendiente: { color: Colors.light.buttonPrimary },
  rowItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.light.cardBackground, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.light.inputBorder },
  rowMes: { color: Colors.light.titleColor, fontWeight: '600', textTransform: 'capitalize' },
  rowCant: { color: Colors.light.titleColor, fontWeight: '600' },
  rowTotal: { color: Colors.light.buttonPrimary, fontWeight: 'bold' },
  empty: { color: Colors.light.inputText, textAlign: 'center', marginTop: 12 },
});

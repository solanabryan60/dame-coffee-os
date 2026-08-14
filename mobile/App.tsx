import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';

const API_BASE = process.env.EXPO_PUBLIC_DAME_API_URL || 'https://www.damecoffeeco.com';

type TabId = 'today' | 'menu' | 'order' | 'catering' | 'rewards';

type MenuItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryLabel: string;
  imageUrl: string | null;
  priceLabel: string;
  isSoldOut: boolean;
  isFeatured: boolean;
  isSeasonal: boolean;
};

type BootstrapPayload = {
  location: {
    title: string;
    address: string;
    hours: string;
    isOpen: boolean;
    mobileOrdering: boolean;
    waitMinutes: number;
    mapsUrl: string;
  };
  menu: MenuItem[];
  events: Array<{
    id: string;
    title: string;
    location_name: string;
    starts_at: string;
  }>;
  refreshedAt: string;
};

const FALLBACK: BootstrapPayload = {
  location: {
    title: 'Dame Coffee',
    address: 'Southern California',
    hours: 'Follow us for today’s hours',
    isOpen: false,
    mobileOrdering: false,
    waitMinutes: 0,
    mapsUrl: 'https://www.damecoffeeco.com/#today',
  },
  menu: [],
  events: [],
  refreshedAt: new Date().toISOString(),
};

const TABS: Array<{ id: TabId; label: string; mark: string }> = [
  { id: 'today', label: 'Today', mark: '⌂' },
  { id: 'menu', label: 'Menu', mark: '☕' },
  { id: 'order', label: 'Order', mark: '+' },
  { id: 'catering', label: 'Catering', mark: '◇' },
  { id: 'rewards', label: 'Rewards', mark: '♥' },
];

function openDame(path: string) {
  return WebBrowser.openBrowserAsync(`${API_BASE}${path}`, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    controlsColor: '#961010',
  });
}

function Header() {
  return (
    <View style={styles.header}>
      <Image source={require('./assets/icon.png')} style={styles.logo} />
      <View>
        <Text style={styles.brandEyebrow}>DAME COFFEE</Text>
        <Text style={styles.brandName}>Dame App</Text>
      </View>
    </View>
  );
}

function TodayScreen({ data }: { data: BootstrapPayload }) {
  const orderingOpen = data.location.isOpen && data.location.mobileOrdering;

  return (
    <View>
      <View style={styles.hero}>
        <Text style={styles.kicker}>DAME COFFEE · DAME VIDA</Text>
        <Text style={styles.heroTitle}>Everything Dame,{`\n`}close at hand.</Text>
        <Text style={styles.heroBody}>Find us, order ahead, and keep every reward close.</Text>
      </View>

      <View style={styles.cardRaised}>
        <View style={styles.rowBetween}>
          <Text style={styles.kickerDark}>{data.location.isOpen ? 'WE’RE BREWING' : 'WE’RE CLOSED'}</Text>
          <View style={[styles.status, !data.location.isOpen && styles.statusClosed]}>
            <Text style={[styles.statusText, !data.location.isOpen && styles.statusTextClosed]}>
              {data.location.isOpen ? 'OPEN' : 'CLOSED'}
            </Text>
          </View>
        </View>
        <Text style={styles.sectionTitle}>Us, today.</Text>
        <Text style={styles.locationTitle}>{data.location.title}</Text>
        <Text style={styles.bodyMuted}>{data.location.address}</Text>
        <View style={styles.detailRow}>
          <View style={styles.detailCell}>
            <Text style={styles.detailLabel}>HOURS</Text>
            <Text style={styles.detailValue}>{data.location.hours}</Text>
          </View>
          <View style={styles.detailCell}>
            <Text style={styles.detailLabel}>WAIT</Text>
            <Text style={styles.detailValue}>
              {data.location.isOpen ? `About ${data.location.waitMinutes} min` : '—'}
            </Text>
          </View>
        </View>
        <Pressable style={styles.primaryButton} onPress={() => openDame(orderingOpen ? '/order' : '/menu')}>
          <Text style={styles.primaryButtonText}>{orderingOpen ? 'ORDER PICKUP' : 'VIEW MENU'}</Text>
        </Pressable>
        <Pressable style={styles.textButton} onPress={() => Linking.openURL(data.location.mapsUrl)}>
          <Text style={styles.textButtonText}>GET DIRECTIONS ↗</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.kickerDark}>UPCOMING</Text>
        <Text style={styles.sectionTitle}>Where we’ll be.</Text>
        {data.events.length ? data.events.slice(0, 3).map((event) => (
          <View style={styles.listRow} key={event.id}>
            <View style={styles.dateMark}>
              <Text style={styles.dateMonth}>{new Date(event.starts_at).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</Text>
              <Text style={styles.dateDay}>{new Date(event.starts_at).getDate()}</Text>
            </View>
            <View style={styles.listCopy}>
              <Text style={styles.listTitle}>{event.title}</Text>
              <Text style={styles.bodyMuted}>{event.location_name}</Text>
            </View>
          </View>
        )) : <Text style={styles.bodyMuted}>New dates will appear here as soon as they are announced.</Text>}
      </View>
    </View>
  );
}

function MenuScreen({ items }: { items: MenuItem[] }) {
  const categories = useMemo(() => Array.from(new Set(items.map((item) => item.categoryLabel))), [items]);
  const [category, setCategory] = useState<string>('');
  const activeCategory = category || categories[0] || '';
  const visibleItems = items.filter((item) => item.categoryLabel === activeCategory);

  return (
    <View style={styles.screenPad}>
      <Text style={styles.kickerDark}>DAME MENU</Text>
      <Text style={styles.pageTitle}>What sounds good?</Text>
      <Text style={styles.pageIntro}>Cold brew, matcha, and flavors made to feel familiar.</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {categories.map((item) => (
          <Pressable
            key={item}
            style={[styles.chip, activeCategory === item && styles.chipActive]}
            onPress={() => setCategory(item)}
          >
            <Text style={[styles.chipText, activeCategory === item && styles.chipTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {visibleItems.length ? visibleItems.map((item) => (
        <Pressable key={item.id} style={styles.menuCard} onPress={() => openDame(`/menu?item=${encodeURIComponent(item.id)}`)}>
          {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.menuImage} /> : (
            <View style={styles.menuPlaceholder}><Text>DAME</Text></View>
          )}
          <View style={styles.menuCopy}>
            <View style={styles.rowBetween}>
              <Text style={styles.menuTitle}>{item.name}</Text>
              <Text style={styles.menuPrice}>{item.priceLabel}</Text>
            </View>
            <Text style={styles.bodyMuted}>{item.description}</Text>
            {item.isSoldOut ? <Text style={styles.soldOut}>SOLD OUT TODAY</Text> : null}
          </View>
        </Pressable>
      )) : <Text style={styles.bodyMuted}>The live menu is refreshing. Pull down to try again.</Text>}
    </View>
  );
}

function ActionScreen({
  eyebrow,
  title,
  body,
  action,
  path,
  secondary,
}: {
  eyebrow: string;
  title: string;
  body: string;
  action: string;
  path: string;
  secondary: string;
}) {
  return (
    <View style={styles.actionScreen}>
      <View style={styles.actionArt}><Text style={styles.actionArtText}>DAME</Text></View>
      <Text style={styles.kicker}>{eyebrow}</Text>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionBody}>{body}</Text>
      <Pressable style={styles.lightButton} onPress={() => openDame(path)}>
        <Text style={styles.lightButtonText}>{action}</Text>
      </Pressable>
      <Text style={styles.actionNote}>{secondary}</Text>
    </View>
  );
}

export default function App() {
  const [tab, setTab] = useState<TabId>('today');
  const [data, setData] = useState<BootstrapPayload>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/mobile/bootstrap`);
      if (!response.ok) throw new Error('Dame is taking a moment to refresh.');
      setData((await response.json()) as BootstrapPayload);
    } catch {
      setData((current) => current);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function renderScreen() {
    if (tab === 'menu') return <MenuScreen items={data.menu} />;
    if (tab === 'order') return (
      <ActionScreen
        eyebrow="ORDER AHEAD"
        title="Your Dame, made for pickup."
        body="Choose your drink, make it yours, and select a pickup time at today’s location."
        action="START AN ORDER"
        path="/order"
        secondary="Secure checkout supports eligible cards and mobile wallets through Dame’s payment partner."
      />
    );
    if (tab === 'catering') return (
      <ActionScreen
        eyebrow="DAME CATERING"
        title="Bring the bar to you."
        body="Build an estimate, choose your date, and request it with a secure deposit."
        action="BUILD MY EVENT"
        path="/catering"
        secondary="Your estimate, address, and event details stay connected from start to finish."
      />
    );
    if (tab === 'rewards') return (
      <ActionScreen
        eyebrow="DAME REWARDS"
        title="Every purchase deserves a little love."
        body="See your points, claim eligible receipts, invite friends, and choose your next reward."
        action="OPEN MY REWARDS"
        path="/rewards/account"
        secondary="Your existing Dame account and points will work here too."
      />
    );
    return <TodayScreen data={data} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <Header />
      {loading ? (
        <View style={styles.loading}>
          <Image source={require('./assets/splash-icon.png')} style={styles.loadingBean} />
          <ActivityIndicator color="#961010" />
          <Text style={styles.loadingText}>Dame is getting ready.</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} tintColor="#961010" onRefresh={() => { setRefreshing(true); load(); }} />}
        >
          {renderScreen()}
        </ScrollView>
      )}
      <View style={styles.tabBar}>
        {TABS.map((item) => (
          <Pressable key={item.id} style={styles.tab} onPress={() => setTab(item.id)}>
            <Text style={[styles.tabMark, tab === item.id && styles.tabActive]}>{item.mark}</Text>
            <Text style={[styles.tabLabel, tab === item.id && styles.tabActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fffdf8',
  },
  header: {
    minHeight: 76,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#dccfca',
    backgroundColor: '#fffdf8',
  },
  logo: { width: 52, height: 52, marginRight: 12 },
  brandEyebrow: { color: '#756963', fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  brandName: { color: '#201815', fontFamily: 'Georgia', fontSize: 24, marginTop: 2 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingBean: { width: 120, height: 120, resizeMode: 'contain' },
  loadingText: { color: '#756963', fontSize: 14 },
  hero: { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 88, backgroundColor: '#961010' },
  kicker: { color: '#f6d8d3', fontSize: 11, fontWeight: '900', letterSpacing: 2.3 },
  kickerDark: { color: '#961010', fontSize: 11, fontWeight: '900', letterSpacing: 2.3 },
  heroTitle: { marginTop: 16, color: '#fffdf8', fontFamily: 'Georgia', fontSize: 48, lineHeight: 49 },
  heroBody: { marginTop: 20, maxWidth: 310, color: '#f6d8d3', fontSize: 16, lineHeight: 24 },
  cardRaised: { marginHorizontal: 14, marginTop: -46, padding: 24, borderRadius: 28, backgroundColor: '#fffdf8', borderWidth: 1, borderColor: '#ead7d1' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  status: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: '#e4f3e9' },
  statusClosed: { backgroundColor: '#f2e8e5' },
  statusText: { color: '#236943', fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  statusTextClosed: { color: '#756963' },
  sectionTitle: { marginTop: 12, color: '#201815', fontFamily: 'Georgia', fontSize: 44, lineHeight: 47 },
  locationTitle: { marginTop: 34, color: '#201815', fontFamily: 'Georgia', fontSize: 26 },
  bodyMuted: { marginTop: 7, color: '#756963', fontSize: 15, lineHeight: 22 },
  detailRow: { marginVertical: 24, paddingVertical: 18, flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#e4d8d3' },
  detailCell: { flex: 1, paddingRight: 10 },
  detailLabel: { color: '#961010', fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  detailValue: { marginTop: 7, color: '#201815', fontSize: 15, fontWeight: '600' },
  primaryButton: { minHeight: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: '#961010' },
  primaryButtonText: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1.4 },
  textButton: { minHeight: 46, alignItems: 'center', justifyContent: 'center' },
  textButtonText: { color: '#961010', fontSize: 11, fontWeight: '900', letterSpacing: 1.3 },
  section: { marginTop: 14, marginHorizontal: 14, padding: 24, borderRadius: 28, backgroundColor: '#f3eee6' },
  listRow: { marginTop: 18, paddingTop: 18, flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#ded2ca' },
  dateMark: { width: 52, alignItems: 'center', marginRight: 14 },
  dateMonth: { color: '#961010', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  dateDay: { color: '#201815', fontFamily: 'Georgia', fontSize: 30 },
  listCopy: { flex: 1 },
  listTitle: { color: '#201815', fontFamily: 'Georgia', fontSize: 20 },
  screenPad: { paddingHorizontal: 18, paddingTop: 34 },
  pageTitle: { marginTop: 12, color: '#201815', fontFamily: 'Georgia', fontSize: 48, lineHeight: 50 },
  pageIntro: { marginTop: 14, color: '#756963', fontSize: 16, lineHeight: 24 },
  chipRow: { gap: 8, paddingVertical: 24 },
  chip: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 999, borderWidth: 1, borderColor: '#dacdc7', backgroundColor: '#fffdf8' },
  chipActive: { borderColor: '#961010', backgroundColor: '#961010' },
  chipText: { color: '#756963', fontSize: 11, fontWeight: '800' },
  chipTextActive: { color: '#fff' },
  menuCard: { marginBottom: 14, overflow: 'hidden', borderRadius: 24, borderWidth: 1, borderColor: '#e2d7d2', backgroundColor: '#fffdf8' },
  menuImage: { width: '100%', height: 190, resizeMode: 'cover' },
  menuPlaceholder: { height: 150, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eee6de' },
  menuCopy: { padding: 20 },
  menuTitle: { flex: 1, color: '#201815', fontFamily: 'Georgia', fontSize: 25 },
  menuPrice: { color: '#961010', fontSize: 16, fontWeight: '900' },
  soldOut: { marginTop: 14, color: '#961010', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  actionScreen: { minHeight: 650, padding: 28, backgroundColor: '#961010' },
  actionArt: { width: 118, height: 118, marginBottom: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 59, backgroundColor: '#fffdf8' },
  actionArtText: { color: '#961010', fontFamily: 'Georgia', fontSize: 23, fontWeight: '700' },
  actionTitle: { marginTop: 15, color: '#fffdf8', fontFamily: 'Georgia', fontSize: 48, lineHeight: 50 },
  actionBody: { marginTop: 22, color: '#f6d8d3', fontSize: 17, lineHeight: 26 },
  lightButton: { minHeight: 58, marginTop: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: '#fffdf8' },
  lightButtonText: { color: '#961010', fontSize: 12, fontWeight: '900', letterSpacing: 1.3 },
  actionNote: { marginTop: 18, color: '#f6d8d3', fontSize: 12, lineHeight: 18 },
  tabBar: { minHeight: 70, paddingBottom: 6, flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#dccfca', backgroundColor: '#fffdf8' },
  tab: { flex: 1, minHeight: 62, alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabMark: { color: '#8b7f78', fontFamily: 'Georgia', fontSize: 19 },
  tabLabel: { color: '#8b7f78', fontSize: 8, fontWeight: '900', letterSpacing: 0.7, textTransform: 'uppercase' },
  tabActive: { color: '#961010' },
});

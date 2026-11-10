import { useState, useMemo } from "react";
import "./App.css";

const STATUS = {
  dream: "Мечта",
  planned: "В планах",
  visited: "Были",
};
const ORDER = ["dream", "planned", "visited"];
const uid = () => Math.random().toString(36).slice(2, 8);
const money = (n) => "$" + Math.round(n).toLocaleString("ru-RU");

/* ───── Начальные данные: страна → города[] → места[] ───── */
const seed = [
  {
    id: "jp", country: "Япония", emoji: "🇯🇵", status: "planned",
    budget: { people: 2, flight: 900, hotel: 85, food: 35 },
    notes: "Лучшее время — конец марта: сакура.",
    cities: [{ id: "tk", name: "Токио", days: 5 }, { id: "ky", name: "Киото", days: 3 }],
    places: [
      { id: uid(), cityId: "tk", title: "Храм Сэнсо-дзи", done: true, cost: 0 },
      { id: uid(), cityId: "tk", title: "TeamLab Planets", done: false, cost: 30 },
      { id: uid(), cityId: "ky", title: "Фусими Инари", done: false, cost: 0 },
    ],
  },
  {
    id: "it", country: "Италия", emoji: "🇮🇹", status: "dream",
    budget: { people: 4, flight: 350, hotel: 110, food: 40 },
    notes: "Поездка с семьёй.",
    cities: [{ id: "rm", name: "Рим", days: 4 }],
    places: [{ id: uid(), cityId: "rm", title: "Колизей", done: false, cost: 18 }],
  },
];

/* ───── Расчёты ───── */
const totalDays = (d) => d.cities.reduce((s, c) => s + c.days, 0);
const budgetOf = (d) => {
  const { people, flight, hotel, food } = d.budget;
  const days = totalDays(d);
  const parts = {
    Перелёты: flight * people,
    Жильё: hotel * days,
    Еда: food * days * people,
    Места: d.places.reduce((s, p) => s + p.cost, 0) * people,
  };
  return { parts, total: Object.values(parts).reduce((a, b) => a + b, 0) };
};
const progressOf = (d) =>
  d.places.length ? Math.round((d.places.filter((p) => p.done).length / d.places.length) * 100) : 0;

/* ───── Общие компоненты ───── */
const Bar = ({ value, variant = "" }) => (
  <div className="bar"><div className={"bar-fill " + variant} style={{ width: value + "%" }} /></div>
);
const Badge = ({ status, onClick }) => (
  <button className={"badge s-" + status} onClick={onClick} title="Сменить статус">{STATUS[status]}</button>
);
const Tabs = ({ tabs, active, onChange }) => (
  <div className="tabs" role="tablist">
    {tabs.map(([key, label]) => (
      <button key={key} role="tab" aria-selected={active === key}
        className={"tab" + (active === key ? " active" : "")} onClick={() => onChange(key)}>{label}</button>
    ))}
  </div>
);

/* ───── Страница 1: Обзор ───── */
function Overview({ dests, goTo, open }) {
  const stats = useMemo(() => {
    const places = dests.flatMap((d) => d.places);
    return { total: dests.reduce((s, d) => s + budgetOf(d).total, 0), done: places.filter((p) => p.done).length, all: places.length };
  }, [dests]);
  const next = dests.filter((d) => d.status === "planned");

  return (
    <section className="stack">
      <h1 className="display">Куда поедем дальше?</h1>
      <p className="muted lead">Собирайте страны, города и места в одну доску и сразу видите, во сколько обойдётся мечта.</p>
      <div className="grid grid-3">
        <div className="card"><div className="muted">Направлений</div><div className="big">{dests.length}</div></div>
        <div className="card"><div className="muted">Общий бюджет</div><div className="big">{money(stats.total)}</div></div>
        <div className="card">
          <div className="muted">Мест отмечено</div>
          <div className="big">{stats.done} из {stats.all}</div>
          <Bar value={stats.all ? (stats.done / stats.all) * 100 : 0} />
        </div>
      </div>
      <h2 className="display h2">Ближайшие планы</h2>
      {next.length === 0 && (
        <div className="card">
          <p className="muted">Нет направлений со статусом «В планах». Переведите мечту в план.</p>
          <button className="btn" onClick={() => goTo("destinations")}>Открыть направления</button>
        </div>
      )}
      <div className="grid grid-2">
        {next.map((d) => (
          <div className="card" key={d.id}>
            <div className="row">
              <span className="flag">{d.emoji}</span>
              <div className="grow">
                <b>{d.country}</b>
                <div className="muted small">{d.cities.map((c) => c.name).join(", ") || "Города не добавлены"} · {totalDays(d)} дн.</div>
              </div>
              <button className="btn btn-ghost" onClick={() => open(d.id)}>Открыть</button>
            </div>
            <Bar value={progressOf(d)} />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ───── Страница 2: Направления ───── */
function Destinations({ dests, setDests, open }) {
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ country: "", emoji: "🌍" });
  const shown = dests.filter((d) => filter === "all" || d.status === filter);

  const add = () => {
    if (!form.country.trim()) return;
    setDests([...dests, {
      id: uid(), country: form.country.trim(), emoji: form.emoji || "🌍", status: "dream",
      budget: { people: 2, flight: 500, hotel: 80, food: 30 }, notes: "", cities: [], places: [],
    }]);
    setForm({ country: "", emoji: "🌍" });
  };
  const cycle = (id) => setDests(dests.map((d) =>
    d.id === id ? { ...d, status: ORDER[(ORDER.indexOf(d.status) + 1) % 3] } : d));

  return (
    <section className="stack">
      <h1 className="display">Направления</h1>
      <div className="card row wrap">
        <input className="emoji-input" value={form.emoji} aria-label="Эмодзи"
          onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
        <input className="grow" value={form.country} placeholder="Страна, например «Португалия»"
          onChange={(e) => setForm({ ...form, country: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && add()} />
        <button className="btn" onClick={add}>Добавить страну</button>
      </div>
      <Tabs active={filter} onChange={setFilter}
        tabs={[["all", `Все (${dests.length})`], ...ORDER.map((s) => [s, STATUS[s]])]} />
      {shown.length === 0 && <p className="muted">В этой категории пусто. Добавьте страну выше.</p>}
      <div className="grid grid-2">
        {shown.map((d) => (
          <article className="ticket" key={d.id}>
            <header className="ticket-head">
              <span className="flag">{d.emoji}</span>
              <span className="display h3 grow">{d.country}</span>
              <Badge status={d.status} onClick={() => cycle(d.id)} />
            </header>
            <div className="ticket-body">
              <div className="row between small">
                <span className="muted">{d.cities.length} гор. · {d.places.length} мест · {d.budget.people} чел.</span>
                <b>{money(budgetOf(d).total)}</b>
              </div>
              <Bar value={progressOf(d)} />
              <div className="row">
                <button className="btn" onClick={() => open(d.id)}>Планировать</button>
                <button className="btn btn-ghost"
                  onClick={() => window.confirm(`Удалить «${d.country}»?`) && setDests(dests.filter((x) => x.id !== d.id))}>
                  Удалить
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ───── Страница 3: Планирование (вкладки) ───── */
function Detail({ dest, update, back }) {
  const [tab, setTab] = useState("places");
  const [newCity, setNewCity] = useState("");
  const [newPlace, setNewPlace] = useState({ title: "", cityId: "", cost: "" });

  if (!dest) return (
    <div className="card">
      <p>Направление не выбрано.</p>
      <button className="btn" onClick={back}>К списку направлений</button>
    </div>
  );

  const { parts, total } = budgetOf(dest);
  const cityId = newPlace.cityId || dest.cities[0]?.id || "";

  const addCity = () => {
    if (!newCity.trim()) return;
    update((d) => ({ ...d, cities: [...d.cities, { id: uid(), name: newCity.trim(), days: 3 }] }));
    setNewCity("");
  };
  const addPlace = () => {
    if (!newPlace.title.trim() || !cityId) return;
    update((d) => ({ ...d, places: [...d.places, { id: uid(), cityId, title: newPlace.title.trim(), done: false, cost: Number(newPlace.cost) || 0 }] }));
    setNewPlace({ title: "", cityId: newPlace.cityId, cost: "" });
  };
  const patchPlace = (id, patch) => update((d) => ({ ...d, places: d.places.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
  const patchCity = (id, patch) => update((d) => ({ ...d, cities: d.cities.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  const setB = (k, v) => update((d) => ({ ...d, budget: { ...d.budget, [k]: Math.max(0, Number(v) || 0) } }));

  return (
    <section className="stack">
      <button className="link" onClick={back}>‹ Все направления</button>
      <div className="row">
        <span className="flag big-flag">{dest.emoji}</span>
        <div>
          <h1 className="display">{dest.country}</h1>
          <div className="muted small">{totalDays(dest)} дн. · {dest.budget.people} чел. · {money(total)}</div>
        </div>
      </div>
      <Tabs active={tab} onChange={setTab} tabs={[
        ["places", `Места (${dest.places.filter((p) => p.done).length}/${dest.places.length})`],
        ["cities", "Города"], ["budget", "Бюджет"], ["notes", "Заметки"],
      ]} />

      {tab === "places" && (
        <div className="stack">
          <Bar value={progressOf(dest)} />
          {dest.cities.length === 0 ? (
            <p className="muted">Сначала добавьте город на вкладке «Города», затем наполняйте чек-лист.</p>
          ) : (
            <>
              <div className="row wrap">
                <input className="grow" value={newPlace.title} placeholder="Достопримечательность"
                  onChange={(e) => setNewPlace({ ...newPlace, title: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && addPlace()} />
                <select value={cityId} onChange={(e) => setNewPlace({ ...newPlace, cityId: e.target.value })}>
                  {dest.cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input className="num" type="number" min="0" value={newPlace.cost} placeholder="$ с чел."
                  onChange={(e) => setNewPlace({ ...newPlace, cost: e.target.value })} />
                <button className="btn" onClick={addPlace}>Добавить</button>
              </div>
              {dest.cities.map((c) => {
                const list = dest.places.filter((p) => p.cityId === c.id);
                return (
                  <div className="card" key={c.id}>
                    <h3 className="display h3">{c.name}</h3>
                    {list.length === 0 && <p className="muted small">Мест пока нет.</p>}
                    <ul className="checklist">
                      {list.map((p) => (
                        <li key={p.id}>
                          <input type="checkbox" checked={p.done} aria-label={p.title} onChange={() => patchPlace(p.id, { done: !p.done })} />
                          <span className={"grow" + (p.done ? " done" : "")}>{p.title}</span>
                          <span className="muted small">{p.cost ? money(p.cost) : "бесплатно"}</span>
                          <button className="x" aria-label="Удалить место"
                            onClick={() => update((d) => ({ ...d, places: d.places.filter((x) => x.id !== p.id) }))}>✕</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {tab === "cities" && (
        <div className="stack">
          <div className="row">
            <input className="grow" value={newCity} placeholder="Название города"
              onChange={(e) => setNewCity(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCity()} />
            <button className="btn" onClick={addCity}>Добавить город</button>
          </div>
          {dest.cities.length === 0 && <p className="muted">Добавьте города, которые хотите посетить.</p>}
          {dest.cities.map((c) => (
            <div className="card row" key={c.id}>
              <b className="grow">{c.name}</b>
              <label className="row small muted">Дней
                <input className="num" type="number" min="1" value={c.days}
                  onChange={(e) => patchCity(c.id, { days: Math.max(1, Number(e.target.value) || 1) })} />
              </label>
              <button className="x" aria-label="Удалить город"
                onClick={() => update((d) => ({ ...d, cities: d.cities.filter((x) => x.id !== c.id), places: d.places.filter((p) => p.cityId !== c.id) }))}>✕</button>
            </div>
          ))}
        </div>
      )}

      {tab === "budget" && (
        <div className="grid grid-2">
          <div className="card stack">
            {[["people", "Путешественников"], ["flight", "Перелёт с человека, $"], ["hotel", "Жильё за ночь, $"], ["food", "Еда в день с человека, $"]].map(([k, label]) => (
              <label className="row between small" key={k}>{label}
                <input className="num" type="number" min="0" value={dest.budget[k]} onChange={(e) => setB(k, e.target.value)} />
              </label>
            ))}
            <p className="muted small">Дни считаются по городам, стоимость мест — по чек-листу.</p>
          </div>
          <div className="card stack">
            {Object.entries(parts).map(([name, v]) => (
              <div key={name}>
                <div className="row between small"><span>{name}</span><b>{money(v)}</b></div>
                <Bar value={total ? (v / total) * 100 : 0} variant="sea" />
              </div>
            ))}
            <div className="row between total display h3"><span>Итого</span><span>{money(total)}</span></div>
          </div>
        </div>
      )}

      {tab === "notes" && (
        <textarea rows={8} value={dest.notes} placeholder="Идеи, брони, кто с кем едет…"
          onChange={(e) => update((d) => ({ ...d, notes: e.target.value }))} />
      )}
    </section>
  );
}

/* ───── Страница 4: Бюджет ───── */
function BudgetPage({ dests, open }) {
  const [goal, setGoal] = useState(8000);
  const rows = dests.map((d) => ({ d, total: budgetOf(d).total })).sort((a, b) => b.total - a.total);
  const sum = rows.reduce((s, r) => s + r.total, 0);
  const max = rows[0]?.total || 1;
  const left = goal - sum;

  return (
    <section className="stack">
      <h1 className="display">Бюджет</h1>
      <div className="card row wrap">
        <label className="row small">Сколько готовы потратить, $
          <input className="num wide" type="number" min="0" value={goal}
            onChange={(e) => setGoal(Math.max(0, Number(e.target.value) || 0))} />
        </label>
        <div className="grow">
          <div className="small">Все мечты: <b>{money(sum)}</b></div>
          <div className={"small strong " + (left >= 0 ? "ok" : "bad")}>
            {left >= 0 ? `Остаётся ${money(left)}` : `Не хватает ${money(-left)}`}
          </div>
        </div>
      </div>
      {rows.length === 0 && <p className="muted">Добавьте направления, чтобы увидеть сравнение.</p>}
      {rows.map(({ d, total }) => (
        <button className="card card-btn" key={d.id} onClick={() => open(d.id)}>
          <div className="row between"><b>{d.emoji} {d.country}</b><b>{money(total)}</b></div>
          <Bar value={(total / max) * 100} variant={"s-" + d.status} />
        </button>
      ))}
    </section>
  );
}

/* ───── Приложение ───── */
export default function App() {
  const [dests, setDests] = useState(seed);
  const [page, setPage] = useState("overview");
  const [openId, setOpenId] = useState(null);

  const open = (id) => { setOpenId(id); setPage("detail"); };
  const update = (fn) => setDests((ds) => ds.map((d) => (d.id === openId ? fn(d) : d)));
  const nav = [["overview", "Обзор"], ["destinations", "Направления"], ["detail", "Планирование"], ["budget", "Бюджет"]];

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="logo display">TravelWish</div>
          <nav aria-label="Разделы">
            {nav.map(([key, label]) => (
              <button key={key} className={page === key ? "active" : ""}
                aria-current={page === key ? "page" : undefined} onClick={() => setPage(key)}>{label}</button>
            ))}
          </nav>
        </div>
      </header>
      <main className="main">
        {page === "overview" && <Overview dests={dests} goTo={setPage} open={open} />}
        {page === "destinations" && <Destinations dests={dests} setDests={setDests} open={open} />}
        {page === "detail" && <Detail dest={dests.find((d) => d.id === openId)} update={update} back={() => setPage("destinations")} />}
        {page === "budget" && <BudgetPage dests={dests} open={open} />}
      </main>
    </div>
  );
}
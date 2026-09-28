import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useMemo } from "react";
import { Nav } from "../components/Nav";
import { BlockIcon } from "../components/BlockIcon";
import { HeroScene } from "../components/three/HeroScene";
import { ModelViewer } from "../components/three/ModelViewer";
import { BLOCKS } from "../lib/blocks";
import { MODELS } from "../lib/models";

const BIOMES = [
  {
    name: "Лес",
    color: "#3e7a2a",
    text: "Дубы, мох и тропы, которые помнят каждого игрока. Стартовая точка для новичка.",
  },
  {
    name: "Пустыня",
    color: "#e0d29a",
    text: "Песчаные дюны и сундуки с алмазами на закате. Идеально для башен и замков.",
  },
  {
    name: "Ад",
    color: "#c05a10",
    text: "Обсидиан, лава и светокамень. Здесь любая постройка светится в темноте.",
  },
  {
    name: "Снежные горы",
    color: "#dde7f2",
    text: "Холодный воздух, белые вершины и хрупкий лёд под ногами.",
  },
];

const FEATURES = [
  {
    title: "Всё из кубов",
    text: "Ни одной готовой картинки. Каждая текстура и каждая 3D-модель собрана кодом прямо в браузере.",
    color: "#7cc44f",
  },
  {
    title: "Живой 3D",
    text: "Остров вращается, модели парят над полом, вода и листва реагируют на свет и камеру.",
    color: "#4fd6d2",
  },
  {
    title: "Свои миры",
    text: "Стройте чанк за чанком, сохраняйте несколько миров и возвращайтесь к стройке в любой момент.",
    color: "#ff8a1f",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Заведите аккаунт",
    text: "Почта и пароль — этого достаточно, чтобы ваши миры не потерялись.",
  },
  {
    step: "02",
    title: "Выберите блок",
    text: "Трава, дерево, руда, стекло — 16 материалов в палитре студии.",
  },
  {
    step: "03",
    title: "Стройте и сохраняйте",
    text: "Клик — блок, правый клик — удаление. Готово? Нажмите «Сохранить».",
  },
];

const reveal = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

function SectionTitle({
  kicker,
  title,
  subtitle,
  id,
}: {
  kicker: string;
  title: string;
  subtitle: string;
  id?: string;
}) {
  return (
    <motion.div
      variants={reveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      className="mx-auto mb-14 max-w-2xl text-center"
      id={id}
    >
      <p className="pixel-heading mb-4 text-[10px] uppercase tracking-[0.3em] text-diamond">
        {kicker}
      </p>
      <h2 className="pixel-heading text-xl text-white sm:text-2xl">{title}</h2>
      <p className="mt-5 text-xl text-stone-400">{subtitle}</p>
    </motion.div>
  );
}

export function Landing() {
  const showcase = useMemo(
    () => [MODELS.find((m) => m.id === "creeper")!, MODELS.find((m) => m.id === "pig")!, MODELS.find((m) => m.id === "castle")!],
    [],
  );

  return (
    <div className="relative overflow-x-hidden">
      <Nav />

      <section className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-24 pt-32 lg:grid-cols-2 lg:pt-40">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <p className="pixel-heading mb-6 inline-flex items-center gap-3 border-2 border-stone-700 bg-stone-900/60 px-4 py-2 text-[10px] text-grass-400">
            <span className="inline-block h-2 w-2 animate-flicker bg-lava-400" />
            Версия 1.0 — блоки загружены
          </p>

          <h1 className="pixel-heading text-2xl leading-relaxed text-white sm:text-3xl">
            МИР
            <br />
            СОБИРАЕТСЯ
            <br />
            <span className="text-grass-400 text-glow">ИЗ КУБИКОВ</span>
          </h1>

          <p className="mt-8 max-w-lg text-2xl leading-snug text-stone-300">
            CUBEWORLD — это конструктор миров в духе Minecraft. Ставьте блоки, поднимайте острова,
            крутите камеру и смотрите, как всё это живёт в настоящем 3D.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link to="/auth?mode=signup" className="btn btn-primary">
              Начать стройку
            </Link>
            <a href="#models" className="btn">
              Смотреть модели
            </a>
          </div>

          <div className="mt-12 flex flex-wrap gap-8 text-stone-400">
            {[
              ["16", "типов блоков"],
              ["3D", "честная сцена"],
              ["∞", "своих миров"],
            ].map(([value, label]) => (
              <div key={label}>
                <p className="pixel-heading text-lg text-diamond">{value}</p>
                <p className="mt-2 text-lg">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.15 }}
          className="panel relative h-[420px] overflow-hidden rounded-sm sm:h-[520px]"
        >
          <HeroScene />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between px-4 py-3 text-sm text-stone-400">
            <span>остров генерируется кодом</span>
            <span className="animate-flicker text-lava-400">живой мир</span>
          </div>
        </motion.div>
      </section>

      <section className="border-y-2 border-stone-800 bg-stone-900/40">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={reveal}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.4 }}
              transition={{ delay: index * 0.12 }}
              className="panel p-6"
            >
              <BlockIcon color={feature.color} />
              <h3 className="pixel-heading mt-5 text-sm text-white">{feature.title}</h3>
              <p className="mt-4 text-xl text-stone-400">{feature.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="models" className="mx-auto max-w-6xl px-4 py-24">
        <SectionTitle
          kicker="Галерея"
          title="МОДЕЛИ СОБРАНЫ ИЗ КУБОВ"
          subtitle="Никаких загруженных ассетов: модели, пиксельные текстуры и освещение созданы кодом на TypeScript."
        />

        <div className="grid gap-6 md:grid-cols-3">
          {showcase.map((model, index) => (
            <motion.figure
              key={model.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="panel overflow-hidden"
            >
              <div className="h-72 w-full">
                <ModelViewer blocks={model.blocks} />
              </div>
              <figcaption className="flex items-center justify-between border-t-2 border-stone-700 px-5 py-4">
                <span className="pixel-heading text-xs text-white">{model.name}</span>
                <span className="text-sm text-stone-500">{model.blocks.length} блоков</span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </section>

      <section id="biomes" className="relative border-y-2 border-stone-800 bg-stone-900/40 py-24">
        <div className="grid-lines absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-6xl px-4">
          <SectionTitle
            kicker="Мир"
            title="ЧЕТЫРЕ БИОМА, ОДИН ДВИЖОК"
            subtitle="Сцена освещения меняется от биома к биому: холодный снег, тёплый лес, красная лавa и сияние алмазов."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {BIOMES.map((biome, index) => (
              <motion.article
                key={biome.name}
                initial={{ opacity: 0, scale: 0.94 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="panel group relative overflow-hidden p-6 transition-transform duration-200 hover:-translate-y-2"
              >
                <div
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ background: biome.color }}
                />
                <div className="mb-5 flex h-24 items-center justify-center">
                  <BlockIcon color={biome.color} scale={1.6} />
                </div>
                <h3 className="pixel-heading text-sm text-white">{biome.name}</h3>
                <p className="mt-3 text-lg text-stone-400">{biome.text}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-24">
        <SectionTitle
          kicker="Палитра"
          title="БЛОКИ ИЗ СТУДИИ"
          subtitle="Каждый блок рисуется пиксель за пикселем на canvas и используется и в 3D, и в интерфейсе."
        />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          className="panel grid grid-cols-2 gap-4 p-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
        >
          {BLOCKS.map((block, index) => (
            <div
              key={block.type}
              className="group flex items-center gap-3 border-2 border-stone-800 bg-stone-950/50 p-3 transition-colors hover:border-grass-500"
              style={{ transitionDelay: `${index * 20}ms` }}
            >
              <BlockIcon color={block.swatch} />
              <div>
                <p className="text-lg leading-tight text-stone-200">{block.name}</p>
                <p className="text-sm text-stone-500">{block.type}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      <section id="how" className="border-y-2 border-stone-800 bg-stone-900/40 py-24">
        <div className="mx-auto max-w-6xl px-4">
          <SectionTitle
            kicker="Процесс"
            title="ТРИ ШАГА ДО СВОЕГО МИРА"
            subtitle="Столько времени нужно, чтобы поставить первый блок на пустой чанк."
          />
          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="panel relative p-7"
              >
                <span className="pixel-heading absolute -top-4 -right-4 bg-stone-800 px-3 py-2 text-[10px] text-diamond">
                  {item.step}
                </span>
                <h3 className="pixel-heading text-sm text-white">{item.title}</h3>
                <p className="mt-4 text-xl text-stone-400">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          className="panel relative overflow-hidden p-12"
        >
          <div className="grid-lines absolute inset-0 opacity-50" />
          <div className="relative">
            <h2 className="pixel-heading text-xl text-white sm:text-2xl">
              ТВОЙ ЧАНК УЖЕ ЖДЁТ
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-2xl text-stone-300">
              Создай аккаунт, открой студию и поставь первый блок. Всё остальное — мука,
              декор и красивые постройки.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link to="/auth?mode=signup" className="btn btn-ember">
                Создать аккаунт
              </Link>
              <Link to="/auth" className="btn">
                У меня уже есть
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      <footer className="border-t-2 border-stone-800 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-stone-500 md:flex-row">
          <p className="pixel-heading text-[10px] text-stone-400">CUBEWORLD © 2026</p>
          <p className="text-lg">Сделано из кубиков, без единой картинки.</p>
        </div>
      </footer>
    </div>
  );
}

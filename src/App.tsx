import React, { useState, useEffect } from 'react';

interface KalkulackaProps {}

const App: React.FC<KalkulackaProps> = () => {
  const [typPrijmu, setTypPrijmu] = useState<'mesicni' | 'rocni'>('mesicni');
  const [mesicniPrijem, setMesicniPrijem] = useState<number>(50000);
  const [rocniPrijem, setRocniPrijem] = useState<number>(600000);
  const [vydaje, setVydaje] = useState<number>(60);
  const [typVydaju, setTypVydaju] = useState<'pausalni' | 'skutecne'>(
    'pausalni'
  );
  const [vlastniVydaje, setVlastniVydaje] = useState<number>(0);
  const [jeVedlejsiCinnost, setJeVedlejsiCinnost] = useState<boolean>(true);

  // Výsledky
  const [zakladDane, setZakladDane] = useState<number>(0);
  const [danPredSlevou, setDanPredSlevou] = useState<number>(0);
  const [dan, setDan] = useState<number>(0);
  const [zdravotniPojisteni, setZdravotniPojisteni] = useState<number>(0);
  const [socialniPojisteni, setSocialniPojisteni] = useState<number>(0);
  const [celkemOdvody, setCelkemOdvody] = useState<number>(0);
  const [cistyPrijem, setCistyPrijem] = useState<number>(0);
  const [doporucenaRezerva, setDoporucenaRezerva] = useState<number>(0);
  const [mesicniZdravotni, setMesicniZdravotni] = useState<number>(0);
  const [mesicniSocialni, setMesicniSocialni] = useState<number>(0);

  // Nové stavy pro pravidlo 7-1-2
  const [mesicniBezneVydaje, setMesicniBezneVydaje] = useState<number>(0);
  const [mesicniZabava, setMesicniZabava] = useState<number>(0);
  const [mesicniZeleznaRezerva, setMesicniZeleznaRezerva] = useState<number>(0);

  // Stavy pro nastavitelné poměry rozpočtu
  const [pomerBezneVydaje, setPomerBezneVydaje] = useState<number>(70);
  const [pomerZabava, setPomerZabava] = useState<number>(10);
  const [pomerZeleznaRezerva, setPomerZeleznaRezerva] = useState<number>(20);

  // Konstanty pro výpočty (rok 2025)
  const danovaSazba = 0.15;
  const sleva2025 = 30840; // Sleva na poplatníka 2025
  const minVymZakladZdravotni = 261819; // Minimální vyměřovací základ pro zdravotní pojištění
  const minVymZakladSocialniHlavni = 130910; // Minimální vyměřovací základ pro sociální pojištění - hlavní činnost
  const minVymZakladSocialniVedlejsi = 52364; // Minimální vyměřovací základ pro sociální pojištění - vedlejší činnost
  const sazbaZdravotni = 0.135;
  const sazbaSocialni = 0.292;
  const limitProVedlejsiCinnost = 111736; // Limit pro vedlejší činnost (2025)

  // Minimální měsíční zálohy (2025)
  const minZalohaZdravotniHlavni = 2956; // Minimální měsíční záloha na ZP pro hlavní činnost
  const minZalohaSocialniHlavni = 3184; // Minimální měsíční záloha na SP pro hlavní činnost
  const minZalohaSocialniVedlejsi = 1274; // Minimální měsíční záloha na SP pro vedlejší činnost

  // Přepočet při změně typu příjmu
  useEffect(() => {
    if (typPrijmu === 'mesicni') {
      setRocniPrijem(mesicniPrijem * 12);
    } else {
      setMesicniPrijem(rocniPrijem / 12);
    }
  }, [typPrijmu, mesicniPrijem, rocniPrijem]);

  // Přepočet při změně vstupních hodnot
  useEffect(() => {
    vypocitat();
  }, [
    rocniPrijem,
    vydaje,
    typVydaju,
    vlastniVydaje,
    jeVedlejsiCinnost,
    pomerBezneVydaje,
    pomerZabava,
    pomerZeleznaRezerva,
  ]);

  const vypocitat = (): void => {
    // Výpočet skutečných výdajů
    let skutecneVydaje = 0;
    if (typVydaju === 'pausalni') {
      skutecneVydaje = rocniPrijem * (vydaje / 100);
    } else {
      skutecneVydaje = vlastniVydaje;
    }

    // Základ daně
    const novaZakladDane = Math.max(0, rocniPrijem - skutecneVydaje);
    setZakladDane(novaZakladDane);

    // Daň z příjmu se slevou na poplatníka
    // Nejprve základ daně zaokrouhlíme na stovky dolů
    const zaokrouhlenyZaklad = Math.floor(novaZakladDane / 100) * 100;
    const danBezSlevy = zaokrouhlenyZaklad * danovaSazba;
    setDanPredSlevou(danBezSlevy);
    const novaDan = Math.max(0, danBezSlevy - sleva2025);
    setDan(novaDan); // Uložíme vypočítanou daň po slevě

    // Vyměřovací základ pro pojištění (50% z daňového základu)
    const vymerovacZaklad = novaZakladDane * 0.5;

    // Zdravotní pojištění
    let noveZdravotni = 0;
    if (jeVedlejsiCinnost) {
      // Při vedlejší činnosti se zdravotní pojištění počítá z dosaženého zisku
      // není zde minimální vyměřovací základ
      noveZdravotni = vymerovacZaklad * sazbaZdravotni;
    } else {
      // Při hlavní činnosti je minimální vyměřovací základ
      if (vymerovacZaklad > minVymZakladZdravotni) {
        noveZdravotni = vymerovacZaklad * sazbaZdravotni;
      } else if (novaZakladDane > 0) {
        noveZdravotni = minVymZakladZdravotni * sazbaZdravotni;
      }
    }
    setZdravotniPojisteni(noveZdravotni);

    // Sociální pojištění
    let noveSocialni = 0;

    // Vedlejší činnost má limity pro povinnou účast
    if (jeVedlejsiCinnost && novaZakladDane <= limitProVedlejsiCinnost) {
      noveSocialni = 0; // Pod limitem nemusí platit
    } else if (jeVedlejsiCinnost && novaZakladDane > limitProVedlejsiCinnost) {
      // Vedlejší činnost nad limitem
      if (vymerovacZaklad > minVymZakladSocialniVedlejsi) {
        noveSocialni = vymerovacZaklad * sazbaSocialni;
      } else {
        noveSocialni = minVymZakladSocialniVedlejsi * sazbaSocialni;
      }
    } else if (!jeVedlejsiCinnost) {
      // Hlavní činnost
      if (vymerovacZaklad > minVymZakladSocialniHlavni) {
        noveSocialni = vymerovacZaklad * sazbaSocialni;
      } else if (novaZakladDane > 0) {
        noveSocialni = minVymZakladSocialniHlavni * sazbaSocialni;
      }
    }
    setSocialniPojisteni(noveSocialni);

    // Celkové odvody
    const noveOdvody = novaDan + noveZdravotni + noveSocialni;
    setCelkemOdvody(noveOdvody);

    // Čistý příjem - výdaje se neodečítají od čistého příjmu, protože jsou již odečteny v základu daně
    const novyCistyPrijem = rocniPrijem - noveOdvody;
    setCistyPrijem(novyCistyPrijem);

    // Měsíční zdravotní a sociální
    let mesicniZdravotniHodnota = 0;
    if (jeVedlejsiCinnost) {
      // Při vedlejší činnosti se platí ze skutečného vyměřovacího základu
      mesicniZdravotniHodnota = noveZdravotni / 12;
    } else {
      // Při hlavní činnosti je minimální záloha
      mesicniZdravotniHodnota = Math.max(
        minZalohaZdravotniHlavni,
        noveZdravotni / 12
      );
    }
    setMesicniZdravotni(mesicniZdravotniHodnota);

    let mesicniSocialniHodnota = 0;
    if (jeVedlejsiCinnost && novaZakladDane <= limitProVedlejsiCinnost) {
      // Pod limitem se sociální neplatí
      mesicniSocialniHodnota = 0;
    } else if (jeVedlejsiCinnost) {
      // Vedlejší činnost nad limitem - musí platit alespoň minimální zálohu pro vedlejší činnost
      mesicniSocialniHodnota = Math.max(
        minZalohaSocialniVedlejsi,
        noveSocialni / 12
      );
    } else {
      // Hlavní činnost - musí platit alespoň minimální zálohu pro hlavní činnost
      mesicniSocialniHodnota = Math.max(
        minZalohaSocialniHlavni,
        noveSocialni / 12
      );
    }
    setMesicniSocialni(mesicniSocialniHodnota);

    // Měsíční daň z příjmu (rovnoměrně rozložená)
    const mesicniDan = novaDan / 12;

    // Doporučená rezerva - počítáme skutečnou měsíční potřebu na odvody + malou rezervu navíc
    const mesicniOdvody =
      mesicniDan + mesicniZdravotniHodnota + mesicniSocialniHodnota;
    // Přidáme rezervu 10%
    const novaRezerva = mesicniOdvody * 1.1;
    setDoporucenaRezerva(novaRezerva);

    // Výpočet pravidla 7-1-2 z čistého měsíčního příjmu
    const cistyMesicniPrijem = novyCistyPrijem / 12;
    setMesicniBezneVydaje(cistyMesicniPrijem * (pomerBezneVydaje / 100)); // % na běžné výdaje
    setMesicniZabava(cistyMesicniPrijem * (pomerZabava / 100)); // % na zábavu
    setMesicniZeleznaRezerva(cistyMesicniPrijem * (pomerZeleznaRezerva / 100)); // % na železnou rezervu
  };

  const formatCZK = (hodnota: number): string => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(hodnota));
  };

  return (
    <div className="p-6 bg-gray-50 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6 text-center text-blue-800">
        Kalkulačka pro OSVČ - 2025
      </h1>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-blue-700">
            Vstupní údaje
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Typ zadávaného příjmu
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="mesicni"
                  checked={typPrijmu === 'mesicni'}
                  onChange={() => setTypPrijmu('mesicni')}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="ml-2">Měsíční</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="rocni"
                  checked={typPrijmu === 'rocni'}
                  onChange={() => setTypPrijmu('rocni')}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="ml-2">Roční</span>
              </label>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {typPrijmu === 'mesicni'
                ? 'Hrubý měsíční příjem (Kč)'
                : 'Hrubý roční příjem (Kč)'}
            </label>
            <input
              type="number"
              value={typPrijmu === 'mesicni' ? mesicniPrijem : rocniPrijem}
              onChange={(e) => {
                const hodnota = Math.max(0, Number(e.target.value));
                if (typPrijmu === 'mesicni') {
                  setMesicniPrijem(hodnota);
                  setRocniPrijem(hodnota * 12);
                } else {
                  setRocniPrijem(hodnota);
                  setMesicniPrijem(hodnota / 12);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              min="0"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Typ výdajů
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="pausalni"
                  checked={typVydaju === 'pausalni'}
                  onChange={() => setTypVydaju('pausalni')}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="ml-2">Paušální</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="skutecne"
                  checked={typVydaju === 'skutecne'}
                  onChange={() => setTypVydaju('skutecne')}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="ml-2">Skutečné</span>
              </label>
            </div>
          </div>

          {typVydaju === 'pausalni' ? (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paušální výdaje (%)
              </label>
              <select
                value={vydaje}
                onChange={(e) => setVydaje(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={80}>80% (zemědělství, řemesla)</option>
                <option value={60}>60% (živnosti)</option>
                <option value={40}>40% (svobodná povolání)</option>
                <option value={30}>30% (příjmy z nájmu)</option>
              </select>
            </div>
          ) : (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Skutečné výdaje (Kč)
              </label>
              <input
                type="number"
                value={vlastniVydaje}
                onChange={(e) =>
                  setVlastniVydaje(Math.max(0, Number(e.target.value)))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                min="0"
              />
            </div>
          )}

          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={jeVedlejsiCinnost}
                onChange={(e) => setJeVedlejsiCinnost(e.target.checked)}
                className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Jedná se o vedlejší činnost
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              (např. student, důchodce, zaměstnanec, rodič na RD)
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-blue-700">Výsledky</h2>

          <div className="space-y-3">
            <div className="flex justify-between py-1">
              <span>Základ daně:</span>
              <span className="font-medium">{formatCZK(zakladDane)}</span>
            </div>

            <div className="flex justify-between py-1">
              <span>Daň z příjmu před slevou (15%):</span>
              <span className="font-medium text-red-600">
                {formatCZK(danPredSlevou)}
              </span>
            </div>

            <div className="flex justify-between py-1">
              <span>Sleva na poplatníka:</span>
              <span className="font-medium text-green-600">
                -{formatCZK(sleva2025)}
              </span>
            </div>

            <div className="flex justify-between py-1">
              <span>Daň z příjmu po slevě:</span>
              <span className="font-medium">{formatCZK(dan)}</span>
            </div>

            <div className="flex justify-between py-1">
              <span>Zdravotní pojištění (13,5%):</span>
              <span className="font-medium text-red-600">
                {formatCZK(zdravotniPojisteni)}
              </span>
            </div>

            <div className="flex justify-between py-1">
              <span>Sociální pojištění (29,2%):</span>
              <span className="font-medium text-red-600">
                {formatCZK(socialniPojisteni)}
              </span>
            </div>

            <div className="flex justify-between py-1 font-medium text-blue-700">
              <span>Měsíční zdravotní pojištění:</span>
              <span className="text-red-600">
                {formatCZK(mesicniZdravotni)}
              </span>
            </div>

            <div className="flex justify-between py-1 font-medium text-blue-700">
              <span>Měsíční sociální pojištění:</span>
              <span className="text-red-600">{formatCZK(mesicniSocialni)}</span>
            </div>

            <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between font-bold py-1">
              <span>Celkové roční odvody:</span>
              <span>{formatCZK(celkemOdvody)}</span>
            </div>

            <div className="flex justify-between text-green-600 font-bold py-1">
              <span>Čistý roční příjem:</span>
              <span>{formatCZK(cistyPrijem)}</span>
            </div>

            <div className="flex justify-between text-green-600 font-medium py-1 border-b border-gray-200 pb-2">
              <span>Čistý měsíční příjem:</span>
              <span>{formatCZK(cistyPrijem / 12)}</span>
            </div>

            <div className="mt-4 pt-2">
              <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                <h3 className="font-semibold mb-1 text-blue-800">
                  Doporučená měsíční rezerva
                </h3>
                <div className="flex justify-between items-center">
                  <span>Měsíčně si odkládejte:</span>
                  <span className="text-xl font-bold text-blue-700">
                    {formatCZK(doporucenaRezerva)}
                  </span>
                </div>
                <div className="mt-2 text-sm">
                  <p className="text-gray-700">Co tato částka pokrývá:</p>
                  <ul className="pl-5 list-disc text-gray-600 mt-1">
                    <li>
                      Daň z příjmu: {dan > 0 ? formatCZK(dan / 12) : '0 Kč'}
                      /měsíc
                    </li>
                    <li>
                      Zdravotní pojištění: {formatCZK(mesicniZdravotni)}/měsíc
                      {jeVedlejsiCinnost && zdravotniPojisteni > 0
                        ? ' (z dosaženého zisku)'
                        : ''}
                      {jeVedlejsiCinnost && zdravotniPojisteni === 0
                        ? ' (při nulovém zisku)'
                        : ''}
                    </li>
                    <li>
                      Sociální pojištění: {formatCZK(mesicniSocialni)}/měsíc
                      {jeVedlejsiCinnost &&
                      zakladDane <= limitProVedlejsiCinnost
                        ? ` (pod limitem ${formatCZK(
                            limitProVedlejsiCinnost
                          )}/rok se neplatí)`
                        : ''}
                      {jeVedlejsiCinnost && zakladDane > limitProVedlejsiCinnost
                        ? ` (nad limitem ${formatCZK(
                            limitProVedlejsiCinnost
                          )}/rok)`
                        : ''}
                    </li>
                    <li>
                      Bezpečnostní rezerva:{' '}
                      {formatCZK(
                        doporucenaRezerva -
                          dan / 12 -
                          mesicniZdravotni -
                          mesicniSocialni
                      )}
                      /měsíc
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nová sekce pro pravidlo 7-1-2 */}
      <div className="mt-6 bg-white p-5 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-purple-700">
          Nastavitelný rozpočet
        </h2>

        {/* Nastavení poměrů */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-3 text-gray-700">
            Nastavení poměrů rozpočtu (%)
          </h3>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Běžné výdaje:
              </label>
              <input
                type="number"
                value={pomerBezneVydaje}
                onChange={(e) =>
                  setPomerBezneVydaje(
                    Math.max(0, Math.min(100, Number(e.target.value)))
                  )
                }
                className="w-16 px-2 py-1 text-center border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                min="0"
                max="100"
              />
              <span className="text-sm text-gray-600">%</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Zábava:
              </label>
              <input
                type="number"
                value={pomerZabava}
                onChange={(e) =>
                  setPomerZabava(
                    Math.max(0, Math.min(100, Number(e.target.value)))
                  )
                }
                className="w-16 px-2 py-1 text-center border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                min="0"
                max="100"
              />
              <span className="text-sm text-gray-600">%</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Železná rezerva:
              </label>
              <input
                type="number"
                value={pomerZeleznaRezerva}
                onChange={(e) =>
                  setPomerZeleznaRezerva(
                    Math.max(0, Math.min(100, Number(e.target.value)))
                  )
                }
                className="w-16 px-2 py-1 text-center border border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500"
                min="0"
                max="100"
              />
              <span className="text-sm text-gray-600">%</span>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Celkem: {pomerBezneVydaje + pomerZabava + pomerZeleznaRezerva}%
            {pomerBezneVydaje + pomerZabava + pomerZeleznaRezerva !== 100 && (
              <span className="text-orange-600 font-medium">
                {' '}
                (doporučeno 100%)
              </span>
            )}
          </div>
          <button
            onClick={() => {
              setPomerBezneVydaje(70);
              setPomerZabava(10);
              setPomerZeleznaRezerva(20);
            }}
            className="mt-2 px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
          >
            Obnovit na 70-10-20
          </button>
        </div>

        <div className="mb-3 text-sm text-gray-600">
          Rozložení čistého měsíčního příjmu podle vašeho nastavení (
          {pomerBezneVydaje}% - {pomerZabava}% - {pomerZeleznaRezerva}%):
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="font-semibold text-blue-800 mb-2">
              {pomerBezneVydaje}% - Běžné výdaje
            </h3>
            <div className="text-2xl font-bold text-blue-700 mb-1">
              {formatCZK(mesicniBezneVydaje)}
            </div>
            <div className="text-sm text-gray-600">
              Jídlo, bydlení, transport, pojištění, běžné potřeby
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <h3 className="font-semibold text-green-800 mb-2">
              {pomerZabava}% - Zábava
            </h3>
            <div className="text-2xl font-bold text-green-700 mb-1">
              {formatCZK(mesicniZabava)}
            </div>
            <div className="text-sm text-gray-600">
              Koníčky, restaurace, zábava, kultura
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
            <h3 className="font-semibold text-orange-800 mb-2">
              {pomerZeleznaRezerva}% - Železná rezerva
            </h3>
            <div className="text-2xl font-bold text-orange-700 mb-1">
              {formatCZK(mesicniZeleznaRezerva)}
            </div>
            <div className="text-sm text-gray-600">
              Dlouhodobé spoření, investice, nouzová rezerva
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <div className="text-sm text-gray-700">
            <strong>Pozor:</strong> Tento rozpočet se počítá z čistého měsíčního
            příjmu <strong>po zdanění</strong>({formatCZK(cistyPrijem / 12)}).
            Doporučená rezerva na odvody ({formatCZK(doporucenaRezerva)}) je
            mimo tento rozpočet a měla by se odkládat dodatečně.
          </div>
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-500 bg-white p-3 rounded shadow">
        <h3 className="font-medium text-gray-700 mb-1">Důležité informace</h3>
        <ul className="space-y-1">
          <li>• Kalkulačka používá údaje platné pro rok 2025.</li>
          <li>
            • Při vedlejší činnosti se neplatí sociální pojištění, pokud roční
            zisk nepřekročí {formatCZK(limitProVedlejsiCinnost)}.
          </li>
          <li>
            • Pro OSVČ jako vedlejší činnost je třeba doložit doklad ČSSZ a
            zdravotní pojišťovně.
          </li>
          <li>• Sleva na poplatníka pro rok 2025: {formatCZK(sleva2025)}.</li>
          <li>
            • Zdravotní pojištění se při vedlejší činnosti platí z dosaženého
            zisku bez minimálního vyměřovacího základu.
          </li>
          <li>
            • Pravidlo 70-10-20 je doporučená metoda rozpočtu, kterou můžete
            upravit podle individuálních potřeb.
          </li>
          <li>• Výpočet je orientační a neslouží jako daňové poradenství.</li>
        </ul>
      </div>
    </div>
  );
};

export default App;

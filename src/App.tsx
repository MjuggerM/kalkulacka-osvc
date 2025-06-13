import React, { useState, useEffect } from 'react';

interface KalkulackaProps {}

const App: React.FC<KalkulackaProps> = () => {
  const [typPrijmu, setTypPrijmu] = useState<'mesicni' | 'rocni'>('mesicni');
  const [mesicniPrijem, setMesicniPrijem] = useState<number>(50000);
  const [rocniPrijem, setRocniPrijem] = useState<number>(600000);
  const [vydaje, setVydaje] = useState<number>(60);
  const [typVydaju, setTypVydaju] = useState<'pausalni' | 'skutecne'>('pausalni');
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
  const sleva2025 = 30840;
  const minVymZakladZdravotni = 261819;
  const minVymZakladSocialniHlavni = 130910;
  const minVymZakladSocialniVedlejsi = 52364;
  const sazbaZdravotni = 0.135;
  const sazbaSocialni = 0.292;
  const limitProVedlejsiCinnost = 111736;

  const minZalohaZdravotniHlavni = 2956;
  const minZalohaSocialniHlavni = 3184;
  const minZalohaSocialniVedlejsi = 1274;

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
    let skutecneVydaje = 0;
    if (typVydaju === 'pausalni') {
      skutecneVydaje = rocniPrijem * (vydaje / 100);
    } else {
      skutecneVydaje = vlastniVydaje;
    }

    const novaZakladDane = Math.max(0, rocniPrijem - skutecneVydaje);
    setZakladDane(novaZakladDane);

    const zaokrouhlenyZaklad = Math.floor(novaZakladDane / 100) * 100;
    const danBezSlevy = zaokrouhlenyZaklad * danovaSazba;
    setDanPredSlevou(danBezSlevy);
    const novaDan = Math.max(0, danBezSlevy - sleva2025);
    setDan(novaDan);

    const vymerovacZaklad = novaZakladDane * 0.5;

    let noveZdravotni = 0;
    if (jeVedlejsiCinnost) {
      noveZdravotni = vymerovacZaklad * sazbaZdravotni;
    } else {
      if (vymerovacZaklad > minVymZakladZdravotni) {
        noveZdravotni = vymerovacZaklad * sazbaZdravotni;
      } else if (novaZakladDane > 0) {
        noveZdravotni = minVymZakladZdravotni * sazbaZdravotni;
      }
    }
    setZdravotniPojisteni(noveZdravotni);

    let noveSocialni = 0;
    if (jeVedlejsiCinnost && novaZakladDane <= limitProVedlejsiCinnost) {
      noveSocialni = 0;
    } else if (jeVedlejsiCinnost && novaZakladDane > limitProVedlejsiCinnost) {
      if (vymerovacZaklad > minVymZakladSocialniVedlejsi) {
        noveSocialni = vymerovacZaklad * sazbaSocialni;
      } else {
        noveSocialni = minVymZakladSocialniVedlejsi * sazbaSocialni;
      }
    } else if (!jeVedlejsiCinnost) {
      if (vymerovacZaklad > minVymZakladSocialniHlavni) {
        noveSocialni = vymerovacZaklad * sazbaSocialni;
      } else if (novaZakladDane > 0) {
        noveSocialni = minVymZakladSocialniHlavni * sazbaSocialni;
      }
    }
    setSocialniPojisteni(noveSocialni);

    const noveOdvody = novaDan + noveZdravotni + noveSocialni;
    setCelkemOdvody(noveOdvody);

    const novyCistyPrijem = rocniPrijem - noveOdvody;
    setCistyPrijem(novyCistyPrijem);

    let mesicniZdravotniHodnota = 0;
    if (jeVedlejsiCinnost) {
      mesicniZdravotniHodnota = noveZdravotni / 12;
    } else {
      mesicniZdravotniHodnota = Math.max(minZalohaZdravotniHlavni, noveZdravotni / 12);
    }
    setMesicniZdravotni(mesicniZdravotniHodnota);

    let mesicniSocialniHodnota = 0;
    if (jeVedlejsiCinnost && novaZakladDane <= limitProVedlejsiCinnost) {
      mesicniSocialniHodnota = 0;
    } else if (jeVedlejsiCinnost) {
      mesicniSocialniHodnota = Math.max(minZalohaSocialniVedlejsi, noveSocialni / 12);
    } else {
      mesicniSocialniHodnota = Math.max(minZalohaSocialniHlavni, noveSocialni / 12);
    }
    setMesicniSocialni(mesicniSocialniHodnota);

    const mesicniDan = novaDan / 12;

    const mesicniOdvody = mesicniDan + mesicniZdravotniHodnota + mesicniSocialniHodnota;
    const novaRezerva = mesicniOdvody * 1.1;
    setDoporucenaRezerva(novaRezerva);

    const cistyMesicniPrijem = novyCistyPrijem / 12;
    setMesicniBezneVydaje(cistyMesicniPrijem * (pomerBezneVydaje / 100));
    setMesicniZabava(cistyMesicniPrijem * (pomerZabava / 100));
    setMesicniZeleznaRezerva(cistyMesicniPrijem * (pomerZeleznaRezerva / 100));
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
        {/* === Vstupní údaje === */}
        <div className="bg-white p-5 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-blue-700">Vstupní údaje</h2>

          <div className="space-y-4">
            {/* Typ příjmu */}
            <div>
              <label className="block font-medium mb-2 text-gray-700">Typ zadávaného příjmu</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    checked={typPrijmu === 'mesicni'}
                    onChange={() => setTypPrijmu('mesicni')}
                    className="cursor-pointer"
                  />
                  Měsíční
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    checked={typPrijmu === 'rocni'}
                    onChange={() => setTypPrijmu('rocni')}
                    className="cursor-pointer"
                  />
                  Roční
                </label>
              </div>
            </div>

            {/* Hrubý příjem */}
            <div>
              <label className="block font-medium mb-1 text-gray-700">
                Hrubý {typPrijmu === 'mesicni' ? 'měsíční' : 'roční'} příjem (Kč)
              </label>
              <input
                type="number"
                value={typPrijmu === 'mesicni' ? mesicniPrijem : rocniPrijem}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (typPrijmu === 'mesicni') {
                    setMesicniPrijem(val);
                  } else {
                    setRocniPrijem(val);
                  }
                }}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>

            {/* Typ výdajů */}
            <div>
              <label className="block font-medium mb-2 text-gray-700">Typ výdajů</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    checked={typVydaju === 'pausalni'}
                    onChange={() => setTypVydaju('pausalni')}
                    className="cursor-pointer"
                  />
                  Paušální
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    checked={typVydaju === 'skutecne'}
                    onChange={() => setTypVydaju('skutecne')}
                    className="cursor-pointer"
                  />
                  Skutečné
                </label>
              </div>
            </div>

            {/* Paušální výdaje */}
            {typVydaju === 'pausalni' && (
              <div>
                <label className="block font-medium mb-1 text-gray-700">Paušální výdaje (%)</label>
                <select
                  value={vydaje}
                  onChange={(e) => setVydaje(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value={80}>80% (řemeslníci)</option>
                  <option value={60}>60% (živnosti)</option>
                  <option value={40}>40% (ostatní)</option>
                  <option value={30}>30% (autorské příjmy)</option>
                </select>
              </div>
            )}

            {/* Skutečné výdaje */}
            {typVydaju === 'skutecne' && (
              <div>
                <label className="block font-medium mb-1 text-gray-700">Skutečné výdaje (Kč)</label>
                <input
                  type="number"
                  value={vlastniVydaje}
                  onChange={(e) => setVlastniVydaje(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
            )}

            {/* Checkbox vedlejší činnost */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={jeVedlejsiCinnost}
                  onChange={(e) => setJeVedlejsiCinnost(e.target.checked)}
                />
                Jedná se o vedlejší činnost
              </label>
              <p className="text-xs text-gray-500 ml-6">
                (např. student, důchodce, zaměstnanec, rodič na RD)
              </p>
            </div>
          </div>
        </div>

        {/* === Výsledky === */}
        <div className="bg-white p-5 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-blue-700">Výsledky</h2>

          {/* Výsledky jako v tvém původním kódu ... */}
          {/* ... zde zůstává beze změny ... */}

          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between items-center py-1">
                <span className="font-medium text-gray-700">Základ daně:</span>
                <span className="text-lg font-bold text-gray-900">{formatCZK(zakladDane)}</span>
              </div>
            </div>

            <div className="bg-red-50 p-3 rounded-lg border border-red-100">
              <h3 className="font-semibold text-red-800 mb-2">Daň z příjmu</h3>

              <div className="flex justify-between py-1">
                <span className="text-sm text-gray-600">Daň před slevou (15%):</span>
                <span className="font-medium text-red-600">{formatCZK(danPredSlevou)}</span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-sm text-gray-600">Sleva na poplatníka:</span>
                <span className="font-medium text-green-600">-{formatCZK(sleva2025)}</span>
              </div>

              <div className="border-t border-red-200 mt-2 pt-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-red-800">Daň k úhradě:</span>
                  <span className="text-lg font-bold text-red-700">{formatCZK(dan)}</span>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
              <h3 className="font-semibold text-orange-800 mb-2">Pojistné odvody</h3>

              <div className="flex justify-between py-1">
                <span className="text-sm text-gray-600">Zdravotní pojištění (13,5%):</span>
                <span className="font-medium text-orange-600">{formatCZK(zdravotniPojisteni)}</span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-sm text-gray-600">Sociální pojištění (29,2%):</span>
                <span className="font-medium text-orange-600">{formatCZK(socialniPojisteni)}</span>
              </div>

              <div className="border-t border-orange-200 mt-2 pt-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-orange-800">Celkem pojistné:</span>
                  <span className="text-lg font-bold text-orange-700">{formatCZK(zdravotniPojisteni + socialniPojisteni)}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <h3 className="font-semibold text-blue-800 mb-2">Měsíční platby</h3>

              <div className="flex justify-between py-1">
                <span className="text-sm text-gray-600">Zdravotní pojištění:</span>
                <span className="font-medium text-blue-600">{formatCZK(mesicniZdravotni)}/měsíc</span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-sm text-gray-600">Sociální pojištění:</span>
                <span className="font-medium text-blue-600">{formatCZK(mesicniSocialni)}/měsíc</span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-sm text-gray-600">Daň z příjmu:</span>
                <span className="font-medium text-blue-600">{formatCZK(dan / 12)}/měsíc</span>
              </div>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg border-2 border-gray-300">
              <div className="flex justify-between items-center py-2 border-b border-gray-300 mb-3">
                <span className="text-lg font-bold text-gray-800">Celkové roční odvody:</span>
                <span className="text-xl font-bold text-red-600">{formatCZK(celkemOdvody)}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-lg font-bold text-gray-800">Čistý roční příjem:</span>
                <span className="text-xl font-bold text-green-600">{formatCZK(cistyPrijem)}</span>
              </div>

              <div className="flex justify-between items-center py-1 mt-2">
                <span className="font-medium text-gray-700">Čistý měsíční příjem:</span>
                <span className="text-lg font-bold text-green-600">{formatCZK(cistyPrijem / 12)}</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-bold text-blue-800 mb-2 text-center">💰 Doporučená měsíční rezerva</h3>
              <div className="text-center mb-3">
                <span className="text-2xl font-bold text-blue-700">{formatCZK(doporucenaRezerva)}</span>
                <span className="text-sm text-gray-600 block">měsíčně si odkládejte</span>
              </div>
              <div className="text-sm bg-white p-3 rounded-md">
                <p className="font-medium text-gray-700 mb-2">Co tato částka pokrývá:</p>
                <ul className="space-y-1 text-gray-600">
                  <li className="flex justify-between">
                    <span>• Daň z příjmu:</span>
                    <span className="font-medium">{dan > 0 ? formatCZK(dan / 12) : '0 Kč'}/měs.</span>
                  </li>
                  <li className="flex justify-between">
                    <span>• Zdravotní pojištění:</span>
                    <span className="font-medium">{formatCZK(mesicniZdravotni)}/měs.</span>
                  </li>
                  <li className="flex justify-between">
                    <span>• Sociální pojištění:</span>
                    <span className="font-medium">{formatCZK(mesicniSocialni)}/měs.</span>
                  </li>
                  <li className="flex justify-between border-t pt-1 mt-1">
                    <span>• Bezpečnostní rezerva (10%):</span>
                    <span className="font-medium text-blue-600">
                      {formatCZK(doporucenaRezerva - dan / 12 - mesicniZdravotni - mesicniSocialni)}/měs.
                    </span>
                  </li>
                </ul>
                {jeVedlejsiCinnost && (
                  <div className="mt-2 p-2 bg-yellow-50 rounded text-xs">
                    <p className="font-medium text-yellow-800">Vedlejší činnost:</p>
                    {zdravotniPojisteni === 0 && (
                      <p className="text-yellow-700">• Zdravotní pojištění se neplatí při nulovém zisku</p>
                    )}
                    {zakladDane <= limitProVedlejsiCinnost ? (
                      <p className="text-yellow-700">• Sociální pojištění se neplatí (pod limitem {formatCZK(limitProVedlejsiCinnost)}/rok)</p>
                    ) : (
                      <p className="text-yellow-700">• Sociální pojištění se platí (nad limitem {formatCZK(limitProVedlejsiCinnost)}/rok)</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nová sekce pro pravidlo 7-1-2 */}
      <div className="mt-6 bg-white p-5 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-purple-700">Nastavitelný rozpočet</h2>

        {/* Nastavení poměrů */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-3 text-gray-700">Nastavení poměrů rozpočtu (%)</h3>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Běžné výdaje:</label>
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
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Zábava:</label>
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
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Železná rezerva:</label>
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
              <span className="text-orange-600 font-medium"> (doporučeno 100%)</span>
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
            <strong>Pozor:</strong> Tento rozpočet se počítá z čistého měsíčního příjmu <strong>po zdanění</strong>({formatCZK(cistyPrijem / 12)}).
            Doporučená rezerva na odvody ({formatCZK(doporucenaRezerva)}) je mimo tento rozpočet a měla by se odkládat dodatečně.
          </div>
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-500 bg-white p-3 rounded shadow">
        <h3 className="font-medium text-gray-700 mb-1">Důležité informace</h3>
        <ul className="space-y-1">
          <li>• Kalkulačka používá údaje platné pro rok 2025.</li>
          <li>• Při vedlejší činnosti se neplatí sociální pojištění, pokud roční zisk nepřekročí {formatCZK(limitProVedlejsiCinnost)}.</li>
          <li>• Pro OSVČ jako vedlejší činnost je třeba doložit doklad ČSSZ a zdravotní pojišťovně.</li>
          <li>• Sleva na poplatníka pro rok 2025: {formatCZK(sleva2025)}.</li>
          <li>• Zdravotní pojištění se při vedlejší činnosti platí z dosaženého zisku bez minimálního vyměřovacího základu.</li>
          <li>• Pravidlo 70-10-20 je doporučená metoda rozpočtu, kterou můžete upravit podle individuálních potřeb.</li>
          <li>• Výpočet je orientační a neslouží jako daňové poradenství.</li>
        </ul>
      </div>
    </div>
  );
};

export default App;

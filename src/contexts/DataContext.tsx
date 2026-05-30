import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./AuthContext";
import { getEcosystemStyles } from "../helpers";

export interface Match {
  id: number;
  g: string;
  rod: string;
  h: string;
  a: string;
  ko: string;
  test?: boolean;
  round?: string;
}

export interface Result {
  home: number | null;
  away: number | null;
  live?: boolean;
}

export interface BusinessUnit {
  id: string;
  label: string;
  nome: string;
  ecossistema: string;
  totalPts: number;
  memberCount: number;
  color: string;
  bg: string;
  text: string;
}

export interface UserRankInfo {
  uid: string;
  name: string;
  emoji: string;
  unit: string;
  pts: number;
}

export interface Prediction {
  home: number;
  away: number;
}

interface DataContextType {
  matches: Match[];
  results: Record<string, Result>;
  businessUnits: Record<string, BusinessUnit>;
  users: UserRankInfo[];
  predictions: Record<string, Prediction>;
  loading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [results, setResults] = useState<Record<string, Result>>({});
  const [businessUnits, setBusinessUnits] = useState<Record<string, BusinessUnit>>({});
  const [users, setUsers] = useState<UserRankInfo[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  
  const [loading, setLoading] = useState<boolean>(true);
  const [matchesLoaded, setMatchesLoaded] = useState<boolean>(false);
  const [resultsLoaded, setResultsLoaded] = useState<boolean>(false);
  const [buLoaded, setBuLoaded] = useState<boolean>(false);
  const [usersLoaded, setUsersLoaded] = useState<boolean>(false);

  // Sync loading state
  useEffect(() => {
    if (matchesLoaded && resultsLoaded && buLoaded && usersLoaded) {
      setLoading(false);
    }
  }, [matchesLoaded, resultsLoaded, buLoaded, usersLoaded]);

  // 1. Matches listener
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "matches"), (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: parseInt(d.id), ...d.data() } as Match));
      setMatches(list);
      setMatchesLoaded(true);
    }, (err) => {
      console.error("Erro ao carregar partidas:", err);
      setMatchesLoaded(true);
    });
    return () => unsub();
  }, []);

  // 2. Results listener
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "results"), (snapshot) => {
      const resMap: Record<string, Result> = {};
      snapshot.forEach(d => {
        resMap[d.id] = d.data() as Result;
      });
      setResults(resMap);
      setResultsLoaded(true);
    }, (err) => {
      console.error("Erro ao carregar resultados:", err);
      setResultsLoaded(true);
    });
    return () => unsub();
  }, []);

  // 3. Business Units listener
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "businessUnits"), (snapshot) => {
      const buMap: Record<string, BusinessUnit> = {};
      snapshot.docs.forEach(d => {
        const data = d.data();
        buMap[d.id] = {
          id: d.id,
          label: data.nome,
          nome: data.nome,
          ecossistema: data.ecossistema,
          ...getEcosystemStyles(data.ecossistema),
          totalPts: data.totalPts || 0,
          memberCount: data.memberCount || 0
        } as BusinessUnit;
      });
      setBusinessUnits(buMap);
      setBuLoaded(true);
    }, (err) => {
      console.error("Erro ao carregar unidades de negócio:", err);
      setBuLoaded(true);
    });
    return () => unsub();
  }, []);

  // 4. Users list listener (for ranking)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const list = snapshot.docs.map(d => ({ uid: d.id, ...d.data() } as UserRankInfo));
      setUsers(list);
      setUsersLoaded(true);
    }, (err) => {
      console.error("Erro ao carregar usuários:", err);
      setUsersLoaded(true);
    });
    return () => unsub();
  }, []);

  // 5. Current User predictions listener
  useEffect(() => {
    if (!user) {
      setPredictions({});
      return;
    }
    const unsub = onSnapshot(collection(db, "users", user.uid, "predictions"), (snapshot) => {
      const predMap: Record<string, Prediction> = {};
      snapshot.forEach(d => {
        predMap[d.id] = d.data() as Prediction;
      });
      setPredictions(predMap);
    }, (err) => {
      console.error("Erro ao carregar palpites:", err);
    });
    return () => unsub();
  }, [user]);

  const value: DataContextType = {
    matches,
    results,
    businessUnits,
    users,
    predictions,
    loading
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData deve ser usado dentro de um DataProvider");
  return context;
}

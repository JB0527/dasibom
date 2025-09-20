import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMissingPerson } from '../../hooks/useMissingPerson';
import { MissingPersonCard } from '../../components/MissingPerson/MissingPersonCard';
import type { MissingPerson } from '../../types/missingPerson';

const MissingPersonListPage: React.FC = () => {
  const navigate = useNavigate();
  const { fetchMissingPersons } = useMissingPerson();
  const [missingPersons, setMissingPersons] = useState<MissingPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'recent' | 'old'>('all');

  useEffect(() => {
    const loadMissingPersons = async () => {
      try {
        const persons = await fetchMissingPersons();
        // 실종시간 최신순으로 정렬 (최근 실종일시가 먼저)
        const sortedPersons = persons.sort((a, b) => {
          const dateA = new Date(a.lastSeenDate).getTime();
          const dateB = new Date(b.lastSeenDate).getTime();
          return dateB - dateA; // 내림차순 (최신순)
        });
        setMissingPersons(sortedPersons);
      } catch (error) {
        console.error('실종자 목록 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMissingPersons();
  }, [fetchMissingPersons]);


  // 필터링된 실종자 목록
  const filteredMissingPersons = missingPersons.filter(person => {
    const hoursElapsed = (new Date().getTime() - new Date(person.lastSeenDate).getTime()) / (1000 * 60 * 60);
    
    switch (filter) {
      case 'recent':
        return hoursElapsed <= 24;
      case 'old':
        return hoursElapsed > 24;
      default:
        return true; // 'all'
    }
  });

  if (isLoading) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">실종자 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      {/* 메인 콘텐츠 */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 필터 버튼 */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">실종자 현황</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                전체 ({missingPersons.length})
              </button>
              <button
                onClick={() => setFilter('recent')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'recent'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                24h 이내 ({missingPersons.filter(person => {
                  const hoursElapsed = (new Date().getTime() - new Date(person.lastSeenDate).getTime()) / (1000 * 60 * 60);
                  return hoursElapsed <= 24;
                }).length})
              </button>
              <button
                onClick={() => setFilter('old')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'old'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                24h 초과 ({missingPersons.filter(person => {
                  const hoursElapsed = (new Date().getTime() - new Date(person.lastSeenDate).getTime()) / (1000 * 60 * 60);
                  return hoursElapsed > 24;
                }).length})
              </button>
            </div>
          </div>
        </div>

        {/* 실종자 카드 목록 */}
        <div className="space-y-4">
          {filteredMissingPersons.map((person) => (
            <MissingPersonCard
              key={person.id}
              person={person}
            />
          ))}
        </div>

        {/* 빈 상태 */}
        {filteredMissingPersons.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filter === 'all' ? '실종자 정보가 없습니다' : 
               filter === 'recent' ? '24시간 이내 실종자가 없습니다' : 
               '24시간 초과 실종자가 없습니다'}
            </h3>
            <p className="text-gray-600">
              {filter === 'all' ? '현재 등록된 실종자 정보가 없습니다.' : 
               filter === 'recent' ? '최근 24시간 내에 실종된 사람이 없습니다.' : 
               '24시간을 초과한 실종자가 없습니다.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MissingPersonListPage;

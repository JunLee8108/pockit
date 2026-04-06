/**
 * 트랜잭션의 표시용 카테고리를 반환
 * - 서브 카테고리면 부모 카테고리를 displayCat으로, 서브 이름을 subName으로
 * - 부모 카테고리면 자신을 displayCat으로, subName은 null
 *
 * @param {object} tx - 트랜잭션 (tx.category, tx.category_id)
 * @param {array} categories - 전체 카테고리 목록
 * @returns {{ displayCat: object|null, subName: string|null }}
 */
export const getDisplayCategory = (tx, categories) => {
  const cat = tx.category;
  if (!cat) return { displayCat: null, subName: null };
  if (!cat.parent_id) return { displayCat: cat, subName: null };

  const parent = categories.find((c) => c.id === cat.parent_id);
  return {
    displayCat: parent || cat,
    subName: cat.name,
  };
};

/**
 * 카테고리 목록에서 부모 카테고리만 필터
 */
export const getParentCategories = (categories) => {
  return categories.filter((c) => !c.parent_id);
};

/**
 * 트랜잭션의 부모 카테고리 ID를 반환 (서브면 부모 ID, 아니면 자신 ID)
 */
export const getParentCategoryId = (tx, categories) => {
  const catId = tx.category_id;
  if (!catId) return null;
  const cat = categories.find((c) => c.id === catId);
  return cat?.parent_id || catId;
};

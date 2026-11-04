export function ownsReview(review,user){
 if(!review||!user?.id)return false;
 if(review.user_id)return String(review.user_id)===String(user.id);
 if(review.reviewer_email)return Boolean(user.email&&review.reviewer_email.toLowerCase().trim()===user.email.toLowerCase().trim());
 return Boolean(user.name&&review.reviewer_name&&review.reviewer_name.trim().toLowerCase()===user.name.trim().toLowerCase());
}

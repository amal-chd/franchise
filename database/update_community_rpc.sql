-- Drop existing function if it exists to allow signature change
DROP FUNCTION IF EXISTS get_community_feed;

-- Create Paginated Feed Function
create or replace function get_community_feed(
  current_user_id uuid,
  filter_author_id uuid default null,
  page_number int default 1,
  page_size int default 10
)
returns table (
  id bigint,
  user_id int, -- legacy integer id for frontend compatibility
  user_name text,
  user_image text,
  content_text text,
  image_url text,
  likes_count int,
  comments_count int,
  is_liked_by_me boolean,
  created_at timestamptz
)
language plpgsql
as $$
declare
  offset_val int;
begin
  offset_val := (page_number - 1) * page_size;

  return query
  select 
    p.id,
    pr.franchise_id as user_id, -- Return legacy ID for frontend
    pr.username as user_name,
    pr.avatar_url as user_image,
    p.content_text,
    p.image_url,
    p.likes_count,
    p.comments_count,
    exists(
      select 1 from community_interactions ci 
      where ci.post_id = p.id 
      and ci.user_id = current_user_id 
      and ci.type = 'like'
    ) as is_liked_by_me,
    p.created_at
  from community_posts p
  join profiles pr on p.user_id = pr.id
  where (filter_author_id is null or p.user_id = filter_author_id)
  order by p.created_at desc
  limit page_size
  offset offset_val;
end;
$$;

-- Create Comments Fetch Function
create or replace function get_post_comments(
  target_post_id bigint
)
returns table (
  id bigint,
  user_id int,
  user_name text,
  user_image text,
  content text,
  created_at timestamptz
)
language plpgsql
as $$
begin
  return query
  select 
    ci.id,
    pr.franchise_id as user_id,
    pr.username as user_name,
    pr.avatar_url as user_image,
    ci.comment_text as content,
    ci.created_at
  from community_interactions ci
  join profiles pr on ci.user_id = pr.id
  where ci.post_id = target_post_id
  and ci.type = 'comment'
  order by ci.created_at asc;
end;
$$;

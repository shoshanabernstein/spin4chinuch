begin;

update public.prizes
set image_url = '/company%20logos/design%20by%20hinda.jpg'
where sponsor_name = 'Design by Hinda';

commit;
